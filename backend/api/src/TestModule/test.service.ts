import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg'

@Injectable()
export class TestService {
    constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

    async pingPayments() {
        const res = await fetch('http://payments:4001/ping');
        const data = await res.json();
        return data;
    }

    async pingDatabase() {
        const res = await this.pool.query('SELECT * FROM test_ping');
        return res.rows;
    }
}