import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg'
import { CreateRequestDto } from './dto/createRequest.dto';
import { request } from 'http';

@Injectable()
export class RequestsService {
    constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

   async createRequest(service_id: number, userId: string, dto : CreateRequestDto) {
        const service = await this.pool.query(
            'SELECT user_id, price, is_active FROM services WHERE id = $1',
            [service_id],
        );
        if (service.rowCount === 0)
            throw new NotFoundException('Service not found');

        const { user_id, price, is_active } = service.rows[0];
        if (!is_active)
            throw new BadRequestException('Service not avalaible');
        if (user_id === userId)
            throw new BadRequestException('You cannot request your own service bruh');
        await this.pool.query(
            'INSERT INTO "request_services"(client_id, service_id, description, amountMBBL, amountUSDC) VALUES($1, $2, $3, $4, $5) RETURNING id',
            [userId, service_id, dto.description, dto.amountMBBL, dto.amountUSDC]
        );
        return { "success" : true };
    };

    async rejectRequest(request_id, userId) {
        const req = await this.pool.query(
            `UPDATE request_services AS rs
            SET request_status = 'rejected'
            FROM services AS s
            WHERE rs.service_id = s.id
            AND rs.id = $1
            AND (
                (rs.request_status = 'pending' AND ($2 = s.user_id OR $2 = rs.client_id))
                OR
                (rs.request_status = 'accepted' AND ($2 = s.user_id OR $2 = rs.client_id))
            )
            RETURNING rs.id`,
            [request_id, userId]
        );

        if (req.rowCount === 0)
            throw new NotFoundException('Does not work');
        return { "success" : true };
    };

    async acceptRequest(request_id, userId) {
        const req = await this.pool.query(
            `SELECT rs.request_status, s.user_id, rs.service_id 
            FROM request_services AS rs JOIN services AS s 
            ON rs.service_id = s.id 
            WHERE rs.id = $1`,
            [request_id]
        );

        if (req.rowCount === 0)
            throw new NotFoundException('Request not found');
        const data = req.rows[0];

        if (data.user_id !== userId)
            throw new ForbiddenException('Not your service');

        if (data.request_status !== 'pending')
            throw new BadRequestException('Already processed');
        
        await this.pool.query(
            "UPDATE request_services SET request_status = 'accepted' WHERE id = $1",
            [request_id],
        );
        return { "success" : true };
    };

    async finishRequest(request_id, userId) {
        const req = await this.pool.query(
            `SELECT request_services.id,
                request_services.finished_client,
                request_services.finished_provider,
                request_services.request_status,
                request_services.client_id,
                services.user_id AS provider_id,
                request_services.service_id
            FROM request_services
            JOIN services
            ON request_services.service_id = services.id
            WHERE request_services.id = $1;`,
            [request_id]
        );

        if (req.rowCount === 0)
            throw new NotFoundException('Request not found');
        const data = req.rows[0];
        if (userId === data.client_id) {
            await this.pool.query(
                `UPDATE request_services
                    SET client_confirm = true
                WHERE id = $1`,
                [request_id]
            );
        }
        else if (userId === data.provider_id) {
            await this.pool.query(
                `UPDATE request_services
                    SET provider_confirm = true
                WHERE id = $1`,
                [request_id]
            );
        } else
            throw new ForbiddenException('Not allowed');

        const res = await this.pool.query(`
            SELECT client_confirm, provider_confirm FROM request_services WHERE id = $1`,
            [request_id]
        )
        if (res.rows[0].client_confirm && res.rows[0].provider_confirm) {
            await this.pool.query(
                "UPDATE request_services SET request_status = 'finished' WHERE id = $1",
                [request_id],
            );
        }
        return { "success" : true };
    };

    async getRequest(request_id: number) {
        const res = await this.pool.query(
            `SELECT rs.id, rs.request_status, rs.client_confirm, rs.provider_confirm, rs.client_id, client.first_name AS client_first_name, client.last_name AS client_last_name, s.user_id AS provider_id, provider.first_name AS provider_first_name, provider.last_name AS provider_last_name, rs.service_id, rs.description, rs.amountMBBL, rs.amountUSDC
            FROM request_services AS rs
            JOIN services AS s ON rs.service_id = s.id
            JOIN users AS client ON rs.client_id = client.id
            JOIN users AS provider ON s.user_id = provider.id
            WHERE rs.id = $1`,
          [request_id],  
        );
        if (res.rowCount === 0)
            throw new NotFoundException('Request not found');
        return res.rows[0];
    }

    async getUserRequests(userId: string) {
        const res = await this.pool.query(
            `SELECT rs.id, rs.request_status, rs.client_confirm, rs.provider_confirm, rs.client_id, client.first_name AS client_first_name, client.last_name AS client_last_name, s.user_id AS provider_id, provider.first_name AS provider_first_name, provider.last_name AS provider_last_name, rs.service_id, rs.description, rs.amountMBBL, rs.amountUSDC
            FROM request_services AS rs
            JOIN services AS s ON rs.service_id = s.id
            JOIN users AS client ON rs.client_id = client.id
            JOIN users AS provider ON s.user_id = provider.id
            WHERE rs.client_id = $1 OR s.user_id = $1
            ORDER BY rs.created_at DESC`,
            [userId],
        );
        return res.rows;
    };

    async getServiceRequests(service_id: number) {
        const res = await this.pool.query(
            `SELECT rs.id, rs.request_status, rs.client_confirm, rs.provider_confirm, rs.client_id, client.first_name AS client_first_name, client.last_name AS client_last_name, s.user_id AS provider_id, provider.first_name AS provider_first_name, provider.last_name AS provider_last_name, rs.service_id, rs.description, rs.amountMBBL, rs.amountUSDC
            FROM request_services AS rs
            JOIN services AS s ON rs.service_id = s.id
            JOIN users AS client ON rs.client_id = client.id
            JOIN users AS provider ON s.user_id = provider.id
            WHERE rs.service_id = $1
            ORDER BY rs.created_at DESC`,
            [service_id],
        );
        return res.rows;
    };

}