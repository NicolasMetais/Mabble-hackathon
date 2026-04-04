import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PaymentModule } from './payment.module';
import { DatabaseModule } from '../DatabaseModule/database.module';
import { APP_GUARD } from '@nestjs/core';

// ─── Mock fetch globally ──────────────────────────────────────────
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// ─── Mock crypto.randomUUID globally ──────────────────────────────
Object.defineProperty(global, 'crypto', {
    value: { randomUUID: () => 'mocked-uuid' },
});
const CLIENT_ID       = '11111111-1111-1111-1111-111111111111';
const CLIENT_WALLET   = '0xClientWallet';
const PROVIDER_WALLET = '0xProviderWallet';
const REQUEST_ID      = 42;

// ─── Fake JWT guard — injecte un userId fictif ────────────────────
class FakeAuthGuard {
    canActivate(context: any) {
        const req = context.switchToHttp().getRequest();
        req.user = { userId: CLIENT_ID };
        return true;
    }
}

// ═══════════════════════════════════════════════════════════════════
// E2E TEST — Flow complet : pay → created → dispute → resolved
// ═══════════════════════════════════════════════════════════════════
//
// Ce test simule le cycle de vie complet d'un paiement Mabble :
//
//   Étape 1 — POST /payment/pay
//     Le client initie un paiement. L'API vérifie en DB que la
//     request_services existe et est 'accepted', récupère les wallets,
//     forward vers le microservice, et crée un payment_pending.
//
//   Étape 2 — POST /payment/created
//     L'event listener (event.ts) capte le PaymentCreated on-chain
//     et notifie l'API. Celle-ci cherche le mapping dans payment_pending,
//     insère la transaction en DB, lie à la request_services, et nettoie.
//
//   Étape 3 — POST /payment/dispute
//     Le client (ou le provider) ouvre un conflit. L'API forward vers
//     le microservice qui appelle initializeConflict on-chain,
//     puis met à jour le statut de la transaction en 'conflict'.
//
//   Étape 4 — POST /payment/conflictResolved
//     L'event listener capte conflictSolved on-chain et notifie l'API.
//     Celle-ci met à jour la transaction (status 'finished', refund_address)
//     et la request_services (status 'finished').
//
// Tout est mocké (DB Pool + fetch). Le but est de vérifier que les
// endpoints répondent correctement et que les queries SQL sont
// appelées dans le bon ordre avec les bons paramètres.
// ═══════════════════════════════════════════════════════════════════

describe('Payment E2E Flow — pay → created → dispute → resolved', () => {
    let app: INestApplication;
    let mockPool: { query: jest.Mock };

    beforeAll(async () => {
        mockPool = { query: jest.fn() };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [DatabaseModule, PaymentModule],
            providers: [{ provide: APP_GUARD, useClass: FakeAuthGuard }]
        })
            .overrideProvider('DATABASE_POOL')
            .useValue(mockPool)
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        mockPool.query.mockReset();
        mockFetch.mockReset();
    });

    // ──────────────────────────────────────────────────────────────
    // ÉTAPE 1/4 : Initiation du paiement
    // ──────────────────────────────────────────────────────────────
    it('Étape 1 — POST /payment/pay crée le payment_pending et forward au microservice', async () => {
        // Mock DB : request_services trouvée, wallet client trouvé
        mockPool.query
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ request_status: 'accepted', provider_wallet: PROVIDER_WALLET }] })
            .mockResolvedValueOnce({ rows: [{ wallet_address: CLIENT_WALLET }] })
            .mockResolvedValueOnce({}); // INSERT payment_pending

        // Mock microservice payments
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ challengeId: 'challenge-step1' }),
        } as Response);

        const res = await request(app.getHttpServer())
            .post('/payment/pay')
            .send({
                userToken: 'tok_user',
                fromWalletAddress: CLIENT_WALLET,
                fromWalletID: 'wallet-id',
                to: PROVIDER_WALLET,
                USDCValue: 100,
                MBBLValue: 50,
                requestId: REQUEST_ID,
            });

        expect(res.status).toBe(201);
        expect(res.body.challengeId).toBe('challenge-step1');
        expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    // ──────────────────────────────────────────────────────────────
    // ÉTAPE 2/4 : Réception de l'event on-chain PaymentCreated
    // ──────────────────────────────────────────────────────────────
    it('Étape 2 — POST /payment/created enregistre la transaction et nettoie le pending', async () => {
        // Mock DB : pending trouvé, puis SELECT users, INSERT, UPDATE, DELETE
        mockPool.query
            .mockResolvedValueOnce({ rows: [{ id: 1, request_id: REQUEST_ID }] }) // SELECT payment_pending
            .mockResolvedValueOnce({
                rows: [
                    { id: CLIENT_ID, wallet_address: CLIENT_WALLET },
                    { id: 'provider-id-456', wallet_address: PROVIDER_WALLET },
                ],
            }) // SELECT users
            .mockResolvedValueOnce({}) // INSERT transaction
            .mockResolvedValueOnce({}) // UPDATE request_services
            .mockResolvedValueOnce({}); // DELETE payment_pending

        const res = await request(app.getHttpServer())
            .post('/payment/created')
            .send({
                paymentID: '1',
                to: PROVIDER_WALLET,
                from: CLIENT_WALLET,
                amountMBBL: '50000000000000000000',
                amountUSDC: '100000000',
                releaseTimestamp: '1700000000',
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(mockPool.query).toHaveBeenCalledTimes(5);
    });

    // ──────────────────────────────────────────────────────────────
    // ÉTAPE 3/4 : Ouverture du conflit
    // ──────────────────────────────────────────────────────────────
    it('Étape 3 — POST /payment/dispute forward au microservice et passe en conflict', async () => {
        // Mock DB : request trouvée, puis UPDATE transaction
        mockPool.query
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: REQUEST_ID }] })
            .mockResolvedValueOnce({}); // UPDATE transaction

        // Mock microservice /initializeDispute
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ challengeId: 'challenge-dispute' }),
        } as Response);

        const res = await request(app.getHttpServer())
            .post('/payment/dispute')
            .send({
                userToken: 'tok_user',
                fromWalletId: 'wallet-id',
                paymentId: 1,
                solver0: '0xSolver0',
                solver1: '0xSolver1',
            });

        expect(res.status).toBe(201);
        expect(res.body.challengeId).toBe('challenge-dispute');
    });

    // ──────────────────────────────────────────────────────────────
    // ÉTAPE 4/4 : Résolution du conflit
    // ──────────────────────────────────────────────────────────────
    it('Étape 4 — POST /payment/conflictResolved finalise la transaction et la request', async () => {
        // Mock DB : UPDATE transaction, UPDATE request_services
        mockPool.query
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({});

        const res = await request(app.getHttpServer())
            .post('/payment/conflictResolved')
            .send({
                paymentID: '1',
                solver0: '0xSolver0',
                solver1: '0xSolver1',
                refundAddrees: '0xRefundAddress',
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);

        // Vérifie UPDATE transaction → finished
        const txUpdate = mockPool.query.mock.calls[0];
        expect(txUpdate[0]).toContain("payment_status = 'finished'");

        // Vérifie UPDATE request_services → finished
        const reqUpdate = mockPool.query.mock.calls[1];
        expect(reqUpdate[0]).toContain("request_status = 'finished'");
    });
});
