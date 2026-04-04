import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PayDto } from './dto/pay.dto';
import { DisputeDto } from './dto/dispute.dto';
import { PaymentCreatedDto } from './dto/payment-created.dto';
import { ReleaseFundDto } from './dto/release-fund.dto';

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
        const data = await response.json();
        if (!response.ok)
            throw new BadRequestException(data?.error ?? 'Payment microservice error');

        // 4. Stocker le mapping (requestId, from_wallet, to_wallet) pour l'event on-chain
        await this.pool.query(
            `INSERT INTO payment_pending (request_id, from_wallet, to_wallet) VALUES ($1, $2, $3)`,
            [dto.requestId, clientWallet, provider_wallet],
        );

        return data; // { challengeId }
    }

    // ----------------------------------------------------------------
    // POST /payment/dispute
    // Forward vers le microservice payments
    // ----------------------------------------------------------------
    async dispute(userId: string, dto: DisputeDto) {
        // Vérifier que la request associée concerne bien cet utilisateur
        const req = await this.pool.query(
            `SELECT rs.id FROM request_services AS rs
             JOIN services AS s ON rs.service_id = s.id
             WHERE rs.payment_id IS NOT NULL
               AND (rs.client_id = $1 OR s.user_id = $1)
             LIMIT 1`,
            [userId],
        );
        // Note : on pourrait affiner en passant requestId dans le DTO — keep it simple pour l'instant

        const response = await fetch(`${PAYMENTS_URL}/initializeDispute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromWalletId: dto.fromWalletId,
                userToken: dto.userToken,
                paymentId: dto.paymentId,
                solver0: dto.solver0,
                solver1: dto.solver1,
            }),
        });
        const data = await response.json();
        if (!response.ok)
            throw new BadRequestException(data?.error ?? 'Dispute microservice error');

        // Mettre à jour le statut de la transaction en DB
        await this.pool.query(
            `UPDATE transaction SET payment_status = 'conflict' WHERE payment_id = $1`,
            [String(dto.paymentId)],
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
}
