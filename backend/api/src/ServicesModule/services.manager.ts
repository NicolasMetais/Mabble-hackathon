import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg'
import { CreateServiceDto } from './dto/createService.dto';
import { UpdateAServiceDto } from './dto/updateAService.dto';
import { CreateRequestDto } from './dto/createRequest.dto';

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
        return res.rows;
    };

    async searchServices(query?: string) {
        if (!query || query.trim() === '') {
            return [];
        }

        const searchTerm = `%${query.trim()}%`;
        const res = await this.pool.query(
            `SELECT s.*, u.first_name, u.last_name, a.skills
             FROM services AS s
             LEFT JOIN users AS u ON u.id = s.user_id
             LEFT JOIN admission_forms AS a ON a.user_id = u.id
             WHERE s.description ILIKE $1
               OR CAST(s.jobs_id AS TEXT) ILIKE $1
               OR CAST(s.amountMBBL AS TEXT) ILIKE $1
               OR CAST(s.amountUSDC AS TEXT) ILIKE $1
               OR concat_ws(' ', u.first_name, u.last_name) ILIKE $1
               OR concat_ws(' ', u.last_name, u.first_name) ILIKE $1
               OR CAST(a.skills AS TEXT) ILIKE $1
             LIMIT 100`,
            [searchTerm],
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