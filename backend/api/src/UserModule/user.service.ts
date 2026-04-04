import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt';
import { updateUserDto } from './dto/updateUser.dto';
import { updatePasswordDto } from './dto/updatePass.dto';

@Injectable()
export class UserService {
    constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

    async updateUser(userId: string, dto: updateUserDto) {
        const fields: string[] = [];
        const values: (string | number)[] = [];
        let i = 1;

        if (dto.email) {
            const res = await this.pool.query(
                'SELECT * FROM "users" WHERE email = $1', [dto.email],
            )
            if (res.rows.length > 0) throw new BadRequestException('Email already used');
            fields.push(`email = $${i++}`);
            values.push(dto.email);
        }
        if (dto.first_name) {
            fields.push(`first_name = $${i++}`);
            values.push(dto.first_name);
        }
        if (dto.last_name) {
            fields.push(`last_name = $${i++}`);
            values.push(dto.last_name);
        }
        if (dto.github_url) {
            fields.push(`github_url = $${i++}`); //Appel API a faire mais pas pressé
            values.push(dto.github_url);
        }
        if (dto.jobs_id) {
            fields.push(`jobs_id = $${i++}`);
            values.push(dto.jobs_id);
        }
        if (!dto.jobs_id && dto.other_jobs) {
            fields.push(`other_jobs = $${i++}`);
            values.push(dto.other_jobs);
        }
        if (dto.description) {
            fields.push(`description = $${i++}`);
            values.push(dto.description);
        }
        if (fields.length === 0)
            throw new BadRequestException('No fields to update');
        values.push(userId);
        const query = `UPDATE "users" SET ${fields.join(', ')} WHERE id = $${i}`
        const res = await this.pool.query(query, values);
        if (res.rowCount === 0)
                throw new NotFoundException();
        return { "success" : true }
    }

    async updatePassword(userId: string, dto: updatePasswordDto) {
        const select = await this.pool.query('SELECT password FROM "users" WHERE id = $1', [userId]);
        console.log(userId);
        const user = select.rows[0];
        if (!user) throw new BadRequestException('User not found');

        const comp = await bcrypt.compare(dto.password, user.password);
        if (!comp) throw new BadRequestException('Invalid password');

        const newHash = await bcrypt.hash(dto.newPassword, 12);
        const res = await this.pool.query('UPDATE "users" SET password = $1 WHERE id = $2', [newHash, userId])

        if (res.rowCount === 0)
                throw new NotFoundException();
        return { "success" : true }
    }

    //pour voir son propre profil
    async getUserById(userId : string) {
        const res = await this.pool.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.wallet_address, j.name AS job_name 
            FROM users AS u
            LEFT JOIN jobs AS j ON u.jobs_id = j.id
            WHERE u.id = $1`,
            [userId],
        );
        if (res.rowCount === 0)
                throw new NotFoundException('User not found');
        return res.rows[0];
    };

    //pour voir le profil des autres user
    async getPublicUserById(userId : string) {
        const res = await this.pool.query(
            `SELECT u.id, u.first_name, u.last_name, j.name AS job_name 
            FROM users AS u
            LEFT JOIN jobs AS j ON u.jobs_id = j.id
            WHERE u.id = $1`,
            [userId],
        );
        if (res.rowCount === 0)
                throw new NotFoundException('User not found');
        return res.rows[0];
    };
}