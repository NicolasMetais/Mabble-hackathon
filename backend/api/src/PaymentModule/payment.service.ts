import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PayDto } from './dto/pay.dto';
import { DisputeDto } from './dto/dispute.dto';
import { PaymentCreatedDto } from './dto/payment-created.dto';
import { ReleaseFundDto } from './dto/release-fund.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { VoteDto } from './dto/vote.dto';

const PAYMENTS_URL = process.env.PAYMENTS_URL ?? 'http://payments:4001';

@Injectable()
export class PaymentService {
    constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

    // ----------------------------------------------------------------
    // POST /payment/pay
    // Forward vers le microservice payments + stockage dans payment_pending
    // ----------------------------------------------------------------
    async pay(userId: string, dto: PayDto) {
        // 1. Vérifier que la request_services existe et appartient au client
        const req = await this.pool.query(
            `SELECT rs.id, rs.request_status, s.user_id AS provider_id, u.wallet_address AS provider_wallet
             FROM request_services AS rs
             JOIN services AS s ON rs.service_id = s.id
             JOIN users AS u ON s.user_id = u.id
             WHERE rs.id = $1 AND rs.client_id = $2`,
            [dto.requestId, userId],
        );
        if (req.rowCount === 0)
            throw new NotFoundException('Request not found or not yours');
        const { request_status, provider_wallet } = req.rows[0];
        if (request_status !== 'accepted')
            throw new BadRequestException('Request must be accepted before payment');

        // 2. Récupérer l'adresse wallet du client (from)
        const userRes = await this.pool.query(
            'SELECT wallet_address FROM users WHERE id = $1',
            [userId],
        );
        const clientWallet: string = userRes.rows[0]?.wallet_address;
        if (!clientWallet)
            throw new BadRequestException('Client wallet not found');

        // 3. Forward au microservice payments
        const UUID = crypto.randomUUID();
        const response = await fetch(`${PAYMENTS_URL}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromWalletAddress: dto.fromWalletAddress,
                fromWalletID: dto.fromWalletID,
                userToken: dto.userToken,
                to: dto.to,
                USDCValue: dto.USDCValue,
                MBBLValue: dto.MBBLValue,
                UUID,
            }),
        });
        const data: any = await response.json();
        console.log('[payment/pay] microservice response:', JSON.stringify(data));
        if (!response.ok)
            throw new BadRequestException(data?.error ?? data?.message ?? 'Payment microservice error');

        // Normaliser challengeId (Circle retourne { data: { challengeId } })
        const challengeId = data?.challengeId ?? data?.data?.challengeId;
        if (!challengeId)
            throw new BadRequestException(`No challengeId in payment response: ${JSON.stringify(data)}`);

        // 4. Stocker le mapping (requestId, from_wallet, to_wallet) pour l'event on-chain
        await this.pool.query(
            `INSERT INTO payment_pending (request_id, from_wallet, to_wallet) VALUES ($1, $2, $3)`,
            [dto.requestId, clientWallet, provider_wallet],
        );

        return { challengeId }; // normalisé pour le frontend
    }

    // ----------------------------------------------------------------
    // POST /payment/dispute
    // Forward vers le microservice payments
    // ----------------------------------------------------------------
    async dispute(userId: string, dto: DisputeDto) {
        // Vérifier que la request associée concerne bien cet utilisateur
        const req = await this.pool.query(
            `SELECT rs.id, rs.client_id, s.user_id as provider_id FROM request_services AS rs
             JOIN services AS s ON rs.service_id = s.id
             WHERE rs.payment_id = $1
               AND (rs.client_id = $2 OR s.user_id = $2)
             LIMIT 1`,
            [String(dto.paymentId), userId],
        );
        if (req.rowCount === 0) {
            throw new BadRequestException("Request not found or not yours");
        }
        
        const clientId = req.rows[0].client_id;
        const providerId = req.rows[0].provider_id;

        // Choix de 2 arbitres aléatoires
        const solvers = await this.pool.query(
            `SELECT id, wallet_address FROM users 
             WHERE id != $1 AND id != $2 AND wallet_address IS NOT NULL
             ORDER BY RANDOM() LIMIT 2`,
            [clientId, providerId]
        );
        if ((solvers.rowCount ?? 0) < 2) {
            throw new BadRequestException("Not enough solvers available in the platform");
        }
        const solver0 = solvers.rows[0];
        const solver1 = solvers.rows[1];

        const response = await fetch(`${PAYMENTS_URL}/initializeDispute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromWalletId: dto.fromWalletId,
                userToken: dto.userToken,
                paymentId: dto.paymentId,
                solver0: solver0.wallet_address,
                solver1: solver1.wallet_address,
            }),
        });
        const data: any = await response.json();
        if (!response.ok)
            throw new BadRequestException(data?.error ?? 'Dispute microservice error');

        // Mettre à jour le statut de la transaction en DB
        await this.pool.query(
            `UPDATE transaction SET payment_status = 'conflict' WHERE payment_id = $1`,
            [String(dto.paymentId)],
        );

        // Ajouter les arbitres dans la table disputes
        await this.pool.query(
            `INSERT INTO disputes (payment_id, solver0_id, solver1_id) VALUES ($1, $2, $3)`,
            [String(dto.paymentId), solver0.id, solver1.id]
        );

        return data; // { challengeId }
    }

    // ----------------------------------------------------------------
    // POST /payment/created  (interne — appelé par event.ts)
    // Enregistre la transaction en DB et met à jour request_services
    // ----------------------------------------------------------------
    async onPaymentCreated(dto: PaymentCreatedDto) {
        // 1. Chercher le mapping (from_wallet, to_wallet) → request_id
        const pending = await this.pool.query(
            `SELECT id, request_id FROM payment_pending
             WHERE from_wallet = $1 AND to_wallet = $2
             ORDER BY created_at DESC LIMIT 1`,
            [dto.from, dto.to],
        );
        const requestId: number | null = pending.rows[0]?.request_id ?? null;

        // 1.5 Identifier explicitement le client et le prestataire via leurs wallets
        // Pour garantir un accès simple au withdraw même si la requete n'a pas été trouvée
        const usersReq = await this.pool.query(
            `SELECT id, wallet_address FROM users WHERE LOWER(wallet_address) IN (LOWER($1), LOWER($2))`,
            [dto.from, dto.to],
        );
        let clientId = null;
        let providerId = null;
        for (const user of usersReq.rows) {
            if (user.wallet_address.toLowerCase() === dto.from.toLowerCase()) clientId = user.id;
            if (user.wallet_address.toLowerCase() === dto.to.toLowerCase()) providerId = user.id;
        }

        // 2. Insérer la transaction
        await this.pool.query(
            `INSERT INTO transaction
                (payment_id, request_id, client_id, provider_id, sender, receiver, amountMBBL, amountUSDC, release_timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (payment_id) DO NOTHING`,
            [
                dto.paymentID,
                requestId,
                clientId,
                providerId,
                dto.from,
                dto.to,
                dto.amountMBBL,
                dto.amountUSDC,
                dto.releaseTimestamp ? parseInt(dto.releaseTimestamp) : null,
            ],
        );

        if (requestId) {
            // 3. Mettre à jour request_services : status → working, lier payment_id
            await this.pool.query(
                `UPDATE request_services
                 SET request_status = 'accepted', payment_id = $1
                 WHERE id = $2`,
                [dto.paymentID, requestId],
            );

            // 4. Nettoyer payment_pending
            await this.pool.query(
                `DELETE FROM payment_pending WHERE request_id = $1`,
                [requestId],
            );
        }

        return { success: true };
    }

    // ----------------------------------------------------------------
    // POST /payment/releaseFund (interne - appelé par event.ts)
    // Rend les fonds retirables
    // ----------------------------------------------------------------
    async onReleaseFund(dto: ReleaseFundDto) {
        await this.pool.query(
            `UPDATE transaction SET payment_status = 'withdrawable' WHERE payment_id = $1`,
            [dto.paymentID]
        );
        return { success: true };
    }

    // ----------------------------------------------------------------
    // POST /payment/conflictResolved  (interne — appelé par event.ts)
    // Met à jour la transaction et la request quand un conflit est résolu
    // ----------------------------------------------------------------
    async onConflictResolved(body: {
        paymentID: string;
        solver0: string;
        solver1: string;
        refundAddrees: string;
    }) {
        await this.pool.query(
            `UPDATE transaction
             SET payment_status = 'finished', refund_address = $2
             WHERE payment_id = $1`,
            [body.paymentID, body.refundAddrees],
        );

        await this.pool.query(
            `UPDATE request_services
             SET request_status = 'finished'
             WHERE payment_id = $1`,
            [body.paymentID],
        );

        return { success: true };
    }

    // ----------------------------------------------------------------
    // GET /payment/transactions
    // ----------------------------------------------------------------
    async getTransactions(userId: string) {
        const res = await this.pool.query(
            `SELECT * FROM transaction WHERE client_id = $1 OR provider_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        return res.rows;
    }

    // ----------------------------------------------------------------
    // GET /payment/arbitrations
    // ----------------------------------------------------------------
    async getArbitrations(userId: string) {
        const res = await this.pool.query(
            `SELECT t.*, d.solver0_id, d.solver1_id 
             FROM transaction t
             JOIN disputes d ON t.payment_id = d.payment_id
             WHERE (d.solver0_id = $1 OR d.solver1_id = $1)
               AND t.payment_status = 'conflict'
             ORDER BY t.created_at DESC`,
            [userId]
        );
        return res.rows;
    }

    // ----------------------------------------------------------------
    // POST /payment/releaseFund (action client — débloquer les fonds)
    // ----------------------------------------------------------------
    async releaseFund(userId: string, dto: WithdrawDto) {
        console.log('[payment/releaseFund] userId:', userId, 'dto:', dto);
        const response = await fetch(`${PAYMENTS_URL}/releaseFund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                _userWalletID: dto._userWalletID,
                _userToken: dto._userToken,
                _paymentId: dto._paymentId,
            }),
        });
        const data: any = await response.json();
        console.log('[payment/releaseFund] microservice response:', JSON.stringify(data));
        if (!response.ok)
            throw new BadRequestException(data?.error ?? 'ReleaseFund microservice error');
        const challengeId = data?.challengeId ?? data?.data?.challengeId;
        if (!challengeId)
            throw new BadRequestException(`No challengeId in releaseFund response: ${JSON.stringify(data)}`);
        return { challengeId };
    }

    // ----------------------------------------------------------------
    // POST /payment/withdraw
    // ----------------------------------------------------------------
    async withdraw(userId: string, dto: WithdrawDto) {
        console.log('[payment/withdraw] userId:', userId, 'dto:', dto);
        const response = await fetch(`${PAYMENTS_URL}/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                _userWalletID: dto._userWalletID,
                _userToken: dto._userToken,
                _paymentId: dto._paymentId,
            }),
        });
        const data: any = await response.json();
        console.log('[payment/withdraw] microservice response:', JSON.stringify(data));
        if (!response.ok)
            throw new BadRequestException(data?.error ?? 'Withdraw microservice error');
        const challengeId = data?.challengeId ?? data?.data?.challengeId;
        if (!challengeId)
            throw new BadRequestException(`No challengeId in withdraw response: ${JSON.stringify(data)}`);
        return { challengeId };
    }

    // ----------------------------------------------------------------
    // POST /payment/vote
    // ----------------------------------------------------------------
    async vote(userId: string, dto: VoteDto) {
        const response = await fetch(`${PAYMENTS_URL}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        const data: any = await response.json();
        if (!response.ok)
            throw new BadRequestException(data?.error ?? 'Vote microservice error');
        return data; // { challengeId }
    }

    // ----------------------------------------------------------------
    // POST /payment/conflictCreated
    // ----------------------------------------------------------------
    async onConflictCreated(body: { paymentID: string; conflictAddress: string }) {
        await this.pool.query(
            `UPDATE transaction SET conflict_address = $2 WHERE payment_id = $1`,
            [body.paymentID, body.conflictAddress]
        );
        return { success: true };
    }
}
