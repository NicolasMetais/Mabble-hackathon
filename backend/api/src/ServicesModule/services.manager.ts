import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg'
import { CreateServiceDto } from './dto/createService.dto';
import { UpdateAServiceDto } from './dto/updateAService.dto';
import { CreateRequestDto } from './dto/createRequest.dto';
import { request } from 'http';

@Injectable()
export class ServicesManager {
    constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

    async createService(userId: string, dto: CreateServiceDto) {
        const exist = await this.pool.query('SELECT jobs_id FROM "services" WHERE user_id = $1', [userId]);
        for (let row of exist.rows) {
            if (row.jobs_id === dto.jobs_id)
                throw new BadRequestException('Only one service per job');
        }
        await this.pool.query(
            'INSERT INTO "services" (user_id, jobs_id, description, amountMBBL, amountUSDC) VALUES($1, $2, $3, $4, $5) RETURNING id',
            [userId, dto.jobs_id, dto.description, dto.amountMBBL, dto.amountUSDC],
        );
        return { "success" : true };
    };

    async getUserServices(userId: string) {
        const res = await this.pool.query(
            'SELECT * FROM services WHERE user_id = $1', [userId],
        );
        console.log(res.rows);
        return res.rows;
    };

    async getAllServices() {
        const res = await this.pool.query(
            `SELECT s.id, s.description, s.amountmbbl as "amountMBBL", s.amountusdc as "amountUSDC", s.is_active,
                    u.id as user_id, u.first_name, u.last_name, u.wallet_address,
                    j.name as role
             FROM services s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN jobs j ON s.jobs_id = j.id`
        );
        return res.rows;
    };

    async getAService(id: number) {
        const res = await this.pool.query(
            'SELECT * FROM services WHERE id = $1', [id],
        );
        if (res.rowCount === 0)
            throw new NotFoundException('Service not found');
        return res.rows[0];
    };

    async updateAService(id: number, userId: string, dto: UpdateAServiceDto) {
        const fields: string[] = [];
        const values: (string | number)[] = [];
        let i = 1;

        if (dto.jobs_id) {
            fields.push(`jobs_id = $${i++}`);
            values.push(dto.jobs_id);
        };
        if (dto.description) {
            fields.push(`description = $${i++}`);
            values.push(dto.description);
        };
        if (dto.amountMBBL) {
            fields.push(`amountMBBL = $${i++}`);
            values.push(dto.amountMBBL);
        };
        if (dto.amountUSDC) {
            fields.push(`amountUSDC = $${i++}`);
            values.push(dto.amountUSDC);
        };
        values.push(id, userId);
        const query = `UPDATE "services" SET ${fields.join(', ')} WHERE id = $${i++} AND user_id = $${i++}`
        const res = await this.pool.query(query, values);
        if (res.rowCount === 0)
            throw new NotFoundException();
        return { "success" : true };

    };

    async deleteAService(id: number, userId: string) {
        const res = await this.pool.query(
            'DELETE FROM "services" WHERE id = $1 AND user_id = $2', [id, userId],
        );
        if (res.rowCount === 0)
            throw new NotFoundException();
        return { "success" : true }
    };

}