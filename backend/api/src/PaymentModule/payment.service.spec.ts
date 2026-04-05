import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// ─── Mock fetch globally ──────────────────────────────────────────
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// ─── Mock crypto.randomUUID globally ──────────────────────────────
Object.defineProperty(global, 'crypto', {
    value: { randomUUID: () => 'mocked-uuid' },
});
function createMockPool() {
    return { query: jest.fn() };
}

// ─── Fake data ────────────────────────────────────────────────────
const CLIENT_ID   = '11111111-1111-1111-1111-111111111111';
const PROVIDER_ID = '22222222-2222-2222-2222-222222222222';
const CLIENT_WALLET   = '0xClientWallet';
const PROVIDER_WALLET = '0xProviderWallet';
const REQUEST_ID  = 42;

const validPayDto = {
    userToken: 'tok_user_abc',
    fromWalletAddress: CLIENT_WALLET,
    fromWalletID: 'wallet-id-client',
    to: PROVIDER_WALLET,
    USDCValue: 100,
    MBBLValue: 50,
    requestId: REQUEST_ID,
};

const validDisputeDto = {
    userToken: 'tok_user_abc',
    fromWalletId: 'wallet-id-client',
    paymentId: 1,
    solver0: '0xSolver0',
    solver1: '0xSolver1',
};

const validPaymentCreatedDto = {
    paymentID: '1',
    to: PROVIDER_WALLET,
    from: CLIENT_WALLET,
    amountMBBL: '50000000000000000000',
    amountUSDC: '100000000',
    releaseTimestamp: '1700000000',
};

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════
describe('PaymentService', () => {
    let service: PaymentService;
    let mockPool: ReturnType<typeof createMockPool>;

    beforeEach(async () => {
        mockPool = createMockPool();
        mockFetch.mockReset();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                { provide: 'DATABASE_POOL', useValue: mockPool },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);
    });

    // ──────────────────────────────────────────────────────────────
    // TEST 1 : pay() — Happy Path
    // ──────────────────────────────────────────────────────────────
    // Simule le scénario complet d'un paiement réussi :
    //   1. La request_services existe (status 'accepted') avec le wallet du provider
    //   2. Le wallet du client est trouvé en DB
    //   3. Le microservice payments répond OK avec un challengeId
    //   4. Un mapping est inséré dans payment_pending
    // Vérifie que le résultat retourné est bien le challengeId du microservice.
    // ──────────────────────────────────────────────────────────────
    it('pay() — happy path : forward au microservice + insert payment_pending', async () => {
        // 1ère query : SELECT request_services + provider wallet
        mockPool.query.mockResolvedValueOnce({
            rowCount: 1,
            rows: [{ request_status: 'accepted', provider_wallet: PROVIDER_WALLET }],
        });
        // 2ème query : SELECT wallet_address du client
        mockPool.query.mockResolvedValueOnce({
            rows: [{ wallet_address: CLIENT_WALLET }],
        });
        // 3ème query : INSERT INTO payment_pending (retour ignoré)
        mockPool.query.mockResolvedValueOnce({});

        // Mock fetch vers le microservice /pay
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ challengeId: 'challenge-abc' }),
        } as Response);

        const result = await service.pay(CLIENT_ID, validPayDto);

        // Vérifie le retour
        expect(result).toEqual({ challengeId: 'challenge-abc' });

        // Vérifie que fetch a été appelé avec les bons paramètres
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const fetchBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
        expect(fetchBody.fromWalletAddress).toBe(CLIENT_WALLET);
        expect(fetchBody.to).toBe(PROVIDER_WALLET);
        expect(fetchBody.USDCValue).toBe(100);
        expect(fetchBody.MBBLValue).toBe(50);

        // Vérifie l'INSERT dans payment_pending (3ème appel à pool.query)
        const insertCall = mockPool.query.mock.calls[2];
        expect(insertCall[0]).toContain('INSERT INTO payment_pending');
        expect(insertCall[1]).toEqual([REQUEST_ID, CLIENT_WALLET, PROVIDER_WALLET]);
    });

    // ──────────────────────────────────────────────────────────────
    // TEST 2 : pay() — Request not found
    // ──────────────────────────────────────────────────────────────
    // Vérifie qu'on lève une NotFoundException quand la request_services
    // n'existe pas en DB (rowCount === 0). Cas : requestId invalide ou
    // le client n'est pas le propriétaire de la requête.
    // ──────────────────────────────────────────────────────────────
    it('pay() — lève NotFoundException si la request_services est introuvable', async () => {
        mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

        await expect(service.pay(CLIENT_ID, validPayDto)).rejects.toThrow(NotFoundException);
    });

    // ──────────────────────────────────────────────────────────────
    // TEST 3 : pay() — Request not accepted
    // ──────────────────────────────────────────────────────────────
    // Vérifie qu'on lève une BadRequestException quand le statut de la
    // request_services n'est pas 'accepted' (ex: 'pending', 'rejected').
    // Le paiement ne peut se faire que si le prestataire a accepté.
    // ──────────────────────────────────────────────────────────────
    it('pay() — lève BadRequestException si le statut n\'est pas "accepted"', async () => {
        mockPool.query.mockResolvedValueOnce({
            rowCount: 1,
            rows: [{ request_status: 'pending', provider_wallet: PROVIDER_WALLET }],
        });

        await expect(service.pay(CLIENT_ID, validPayDto)).rejects.toThrow(BadRequestException);
    });

    // ──────────────────────────────────────────────────────────────
    // TEST 4 : pay() — Client wallet missing
    // ──────────────────────────────────────────────────────────────
    // Vérifie qu'on lève une BadRequestException quand le client n'a
    // pas de wallet_address en DB (wallet_address est null).
    // Cas : l'utilisateur n'a pas encore créé son wallet Circle.
    // ──────────────────────────────────────────────────────────────
    it('pay() — lève BadRequestException si le wallet client est manquant', async () => {
        // Request OK
        mockPool.query.mockResolvedValueOnce({
            rowCount: 1,
            rows: [{ request_status: 'accepted', provider_wallet: PROVIDER_WALLET }],
        });
        // Wallet client null
        mockPool.query.mockResolvedValueOnce({
            rows: [{ wallet_address: null }],
        });

        await expect(service.pay(CLIENT_ID, validPayDto)).rejects.toThrow(BadRequestException);
    });

    // ──────────────────────────────────────────────────────────────
    // TEST 5 : pay() — Microservice error
    // ──────────────────────────────────────────────────────────────
    // Vérifie qu'on lève une BadRequestException quand le microservice
    // payments (Express sur port 4001) retourne une erreur HTTP.
    // Le message d'erreur du microservice est propagé.
    // ──────────────────────────────────────────────────────────────
    it('pay() — lève BadRequestException si le microservice répond en erreur', async () => {
        // Request OK
        mockPool.query.mockResolvedValueOnce({
            rowCount: 1,
            rows: [{ request_status: 'accepted', provider_wallet: PROVIDER_WALLET }],
        });
        // Wallet client OK
        mockPool.query.mockResolvedValueOnce({
            rows: [{ wallet_address: CLIENT_WALLET }],
        });

        // Microservice répond 400
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'fromWalletAddress undefined' }),
        } as Response);

        await expect(service.pay(CLIENT_ID, validPayDto)).rejects.toThrow(BadRequestException);
    });

    // ──────────────────────────────────────────────────────────────
    // TEST 6 : onPaymentCreated() — Happy path avec pending
    // ──────────────────────────────────────────────────────────────
    // Simule la réception de l'event PaymentCreated on-chain :
    //   1. Cherche le mapping dans payment_pending via (from, to)
    //   2. Insère la transaction dans la table transaction
    //   3. Met à jour request_services (status 'accepted', lie payment_id)
    //   4. Nettoie payment_pending
    // Vérifie que les 4 queries SQL sont exécutées dans l'ordre.
    // ──────────────────────────────────────────────────────────────
    it('onPaymentCreated() — enregistre la transaction et nettoie le pending', async () => {
        // 1ère query : SELECT payment_pending → trouvé
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: 1, request_id: REQUEST_ID }],
        });
        // 2ème query : SELECT users
        mockPool.query.mockResolvedValueOnce({
            rows: [
                { id: CLIENT_ID, wallet_address: CLIENT_WALLET },
                { id: PROVIDER_ID, wallet_address: PROVIDER_WALLET },
            ],
        });
        // 3ème query : INSERT INTO transaction
        mockPool.query.mockResolvedValueOnce({});
        // 4ème query : UPDATE request_services
        mockPool.query.mockResolvedValueOnce({});
        // 5ème query : DELETE FROM payment_pending
        mockPool.query.mockResolvedValueOnce({});

        const result = await service.onPaymentCreated(validPaymentCreatedDto);

        expect(result).toEqual({ success: true });
        expect(mockPool.query).toHaveBeenCalledTimes(5);

        // Vérifie l'INSERT transaction
        const insertCall = mockPool.query.mock.calls[2];
        expect(insertCall[0]).toContain('INSERT INTO transaction');
        expect(insertCall[1][0]).toBe('1'); // payment_id
        expect(insertCall[1][1]).toBe(REQUEST_ID); // request_id
        expect(insertCall[1][2]).toBe(CLIENT_ID); // client_id
        expect(insertCall[1][3]).toBe(PROVIDER_ID); // provider_id

        // Vérifie l'UPDATE request_services
        const updateCall = mockPool.query.mock.calls[3];
        expect(updateCall[0]).toContain('UPDATE request_services');

        // Vérifie le DELETE payment_pending
        const deleteCall = mockPool.query.mock.calls[4];
        expect(deleteCall[0]).toContain('DELETE FROM payment_pending');
        expect(deleteCall[1]).toEqual([REQUEST_ID]);
    });

    // ──────────────────────────────────────────────────────────────
    // TEST 7 : onPaymentCreated() — Sans mapping pending
    // ──────────────────────────────────────────────────────────────
    // Cas où l'event on-chain arrive mais qu'aucun payment_pending
    // ne correspond (paiement direct sans passer par l'API, ou timing).
    // La transaction est quand même enregistrée avec request_id = null.
    // Pas d'UPDATE ni de DELETE (le bloc if(requestId) n'est pas exécuté).
    // ──────────────────────────────────────────────────────────────
    it('onPaymentCreated() — insère la transaction même sans pending (request_id null)', async () => {
        // 1ère query : payment_pending vide
        mockPool.query.mockResolvedValueOnce({ rows: [] });
        // 2ème query : SELECT users
        mockPool.query.mockResolvedValueOnce({
            rows: [
                { id: CLIENT_ID, wallet_address: CLIENT_WALLET },
                { id: PROVIDER_ID, wallet_address: PROVIDER_WALLET },
            ],
        });
        // 3ème query: INSERT INTO transaction
        mockPool.query.mockResolvedValueOnce({});

        const result = await service.onPaymentCreated(validPaymentCreatedDto);

        expect(result).toEqual({ success: true });
        // Seulement 3 queries : SELECT pending + SELECT users + INSERT transaction
        expect(mockPool.query).toHaveBeenCalledTimes(3);

        // request_id = null dans l'INSERT
        const insertCall = mockPool.query.mock.calls[2];
        expect(insertCall[1][1]).toBeNull(); // request_id
        expect(insertCall[1][2]).toBe(CLIENT_ID); // client_id
    });

    // ──────────────────────────────────────────────────────────────
    // TEST 8 : dispute() — Happy path
    // ──────────────────────────────────────────────────────────────
    // Simule l'ouverture d'un conflit :
    //   1. Vérifie que l'utilisateur est lié à une request avec un payment
    //   2. Forward la demande au microservice /initializeDispute
    //   3. Met à jour le statut de la transaction en 'conflict'
    // ──────────────────────────────────────────────────────────────
    it('dispute() — forward au microservice + update status conflict', async () => {
        // Query vérification user
        mockPool.query.mockResolvedValueOnce({
            rowCount: 1,
            rows: [{ id: REQUEST_ID }],
        });
        // Update transaction status
        mockPool.query.mockResolvedValueOnce({});

        // Mock microservice /initializeDispute
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ challengeId: 'challenge-dispute-xyz' }),
        } as Response);

        const result = await service.dispute(CLIENT_ID, validDisputeDto);

        expect(result).toEqual({ challengeId: 'challenge-dispute-xyz' });

        // Vérifie le fetch vers /initializeDispute
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const fetchUrl = mockFetch.mock.calls[0][0] as string;
        expect(fetchUrl).toContain('/initializeDispute');

        // Vérifie l'UPDATE transaction → 'conflict'
        const updateCall = mockPool.query.mock.calls[1];
        expect(updateCall[0]).toContain("payment_status = 'conflict'");
        expect(updateCall[1]).toEqual([String(validDisputeDto.paymentId)]);
    });

    // ──────────────────────────────────────────────────────────────
    // TEST 9 : onConflictResolved() — Happy path
    // ──────────────────────────────────────────────────────────────
    // Simule la résolution d'un conflit (event conflictSolved on-chain) :
    //   1. Met à jour la transaction : status → 'finished', refund_address
    //   2. Met à jour request_services : status → 'finished'
    // Vérifie que les deux UPDATE SQL sont exécutés correctement.
    // ──────────────────────────────────────────────────────────────
    it('onConflictResolved() — met à jour transaction et request_services en finished', async () => {
        // UPDATE transaction
        mockPool.query.mockResolvedValueOnce({});
        // UPDATE request_services
        mockPool.query.mockResolvedValueOnce({});

        const body = {
            paymentID: '1',
            solver0: '0xSolver0',
            solver1: '0xSolver1',
            refundAddrees: '0xRefundAddress',
        };

        const result = await service.onConflictResolved(body);

        expect(result).toEqual({ success: true });
        expect(mockPool.query).toHaveBeenCalledTimes(2);

        // Vérifie l'UPDATE transaction
        const txUpdate = mockPool.query.mock.calls[0];
        expect(txUpdate[0]).toContain("payment_status = 'finished'");
        expect(txUpdate[0]).toContain('refund_address');
        expect(txUpdate[1]).toEqual(['1', '0xRefundAddress']);

        // Vérifie l'UPDATE request_services
        const reqUpdate = mockPool.query.mock.calls[1];
        expect(reqUpdate[0]).toContain("request_status = 'finished'");
        expect(reqUpdate[1]).toEqual(['1']);
    });

    // ──────────────────────────────────────────────────────────────
    // TEST 10 : onReleaseFund() — Met le statut en withdrawable
    // ──────────────────────────────────────────────────────────────
    it('onReleaseFund() — met à jour le statut en withdrawable', async () => {
        mockPool.query.mockResolvedValueOnce({});

        const result = await service.onReleaseFund({ paymentID: '1' });
        
        expect(result).toEqual({ success: true });
        expect(mockPool.query).toHaveBeenCalledTimes(1);
        const queryCall = mockPool.query.mock.calls[0];
        expect(queryCall[0]).toContain("payment_status = 'withdrawable'");
        expect(queryCall[1]).toEqual(['1']);
    });
});
