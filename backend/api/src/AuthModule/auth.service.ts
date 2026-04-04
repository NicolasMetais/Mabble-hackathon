import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { AdmissionDto } from './dto/admission.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

@Injectable()
export class AuthService {
    constructor(
        @Inject('DATABASE_POOL') private pool: Pool 
        , private jwtService: JwtService) {}

    async signup(dto: { email: string; password: string; first_name: string; last_name: string;}) {
        if (dto.email) {
            const res = await this.pool.query(
                'SELECT * FROM "users" WHERE email = $1', [dto.email],
            )
            if (res.rows.length > 0) throw new BadRequestException('Email already used');
        }
        const hash = await bcrypt.hash(dto.password, 12)
        // const wallet_address = await fetch("localhost:4001/getWallet"); //A SETUP APRES LE MERGE
        const wallet_address = "test";
        await this.pool.query(
            'INSERT INTO "users" (email, wallet_address ,password, first_name, last_name) VALUES($1, $2, $3, $4, $5) RETURNING id',
            [dto.email, wallet_address, hash, dto.first_name, dto.last_name],
        );
        return { "success" : true };
    }

    async login(dto: {email:string; password: string }) {
        const res = await this.pool.query('SELECT * FROM "users" WHERE email=$1',[dto.email]);
        const user = res.rows[0];
        if (!user) throw new BadRequestException('Invalid Credentials');
        await fetch("http://payments:4001/userCreationWallet", {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                "action": "requestEmailOTP",
                "email": user.email,
                "deviceId": "LEFRONTENVOIUNTRUC", //TEMPORAIRE
            })
        });
        const compare = await bcrypt.compare(dto.password, user.password);
        if (!compare) throw new BadRequestException('Invalid Credentials');

<<<<<<< HEAD
        if(!response.ok)
            throw new BadRequestException('Connect Wallet Error');

        const data = await response.json() as ConnectWalletResponse;
        const token = this.jwtService.sign({ sub: user.id, email: user.email }, {expiresIn: '5h'});

        return { message : "Email sent", token: token, deviceToken: data.deviceToken, deviceEncryption: data.deviceEncryption, otpToken: data.otpToken };
=======
        const token = this.jwtService.sign({ sub: user.id, email: user.email });
        return { token };
>>>>>>> origin/contract
    };

    async getUserChallenge() { //Wallet Creation
        const res = await fetch("http://payments:4001/userCreationWallet", {
            method: "POST",
            headers: {
                  "Content-type": "application/json"
            },
            body: JSON.stringify({
              "action": "initialize",
                "userToken": "LEFRONTENVOIUNTOKEN", //TEMPORAIRE
            })
        });
        if (!res.ok)
            throw new BadRequestException('Circle Error');
        const res1 = await fetch("http://payments:4001/welcomme2mabble" , {

        })
        const data = await res.json() as ChallengeId;
        return { challengeId: data.challengeId };
    };

    async addWallet(userId: string, dto: UserTokenDto) {
        const exist = await this.pool.query(`
            SELECT wallet_id FROM users WHERE id = $1`, 
            [userId],
        );

        if (exist.rows[0]?.wallet_id)
            return { success: true, message: "Wallet already exists" };

        const res = await fetch("http://payments:4001/getWallet", {
            method: "POST",
            headers: {
                  "Content-type": "application/json"
            },
            body: JSON.stringify({
                "userToken": dto.userToken,
            })
        });
        if (!res.ok)
            throw new BadRequestException("Error fetching the wallet");
        const data = await res.json() as AddWallet;
        await this.pool.query(`UPDATE "users" SET wallet_id = $1, wallet_address = $2 WHERE id = $3`,
            [data.walletId, data.walletAddress , userId],
        )

        const welcome = await fetch("http://payments:4001/welcome", {
            method: "POST",
            headers: {
                "Content-type" : "application/json",
            },
            body :JSON.stringify({
                _userWalletAddress: data.walletAddress,
                _userWalletID: data.walletId,
                _userToken : dto.userToken
            })
        })
        if (!welcome.ok)
            throw new BadRequestException('Process failed');
        return { success: true, message : "Wallet Created" };
    };

    async getWallet(userId: string) {
        const res = await fetch("http://payments:4001/getWallet", {
            method: "POST",
            headers: {
                  "Content-type": "application/json"
            },
            body: JSON.stringify({
                "userToken": "LEFRONTENVOIUNTOKEN", //TEMPORAIRE
            })
        });
        console.log(res);
        // await this.pool.query(`UPDATE "users" SET wallet_id = $1, wallet_address = $2 WHERE id = $3`,
        //     [res.wallets.id , res.wallets.address , userId],
        // )
        return { "success": true };
    };

    async getBalance() {
        const res = await fetch("http://payments:4001/getWallet", {
            method: "POST",
            headers: {
                  "Content-type": "application/json"
            },
            body: JSON.stringify({
                "userToken": "LEFRONTENVOIUNTOKEN", //TEMPORAIRE
            })
        });
        console.log(res);
        return { "challengeId": res };
    };

    async admission(userId: string, dto: AdmissionDto) {
        const exist = await this.pool.query( 'SELECT id FROM admission_forms WHERE user_id = $1', [userId]);
        if ((exist.rowCount as number) > 0)
            throw new BadRequestException('Already applied');
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                'INSERT INTO "admission_forms"(user_id, portfolio_url, skills, presentation) VALUES($1, $2, $3, $4) RETURNING id',
                [userId, dto.portfolio_url, dto.skills, dto.presentation],
            );

            await client.query(
                'UPDATE "users" SET account_status = $1 WHERE id = $2',
                ['pending', userId],
            );

            await client.query('COMMIT');

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
        return { "success" : true }
    }

    async listAllPendingAdmissions() {
        const res = await this.pool.query(
            `SELECT a.id, a.user_id, a.portfolio_url, a.skills, a.presentation, u.account_status
            FROM admission_forms AS a
            JOIN users AS u ON a.user_id = u.id
            WHERE u.account_status = 'pending'`
        );
        return res.rows;
    }

    async listAllAdmissions() {
        const res = await this.pool.query(
            `SELECT a.id, a.user_id, a.portfolio_url, a.skills, a.presentation, u.account_status
            FROM admission_forms AS a
            JOIN users AS u ON a.user_id = u.id`
        );
        return res.rows;
    }

    async acceptUser(userId: string) {
        await this.pool.query(
            'UPDATE users SET account_status = $1, first_connect = $2 WHERE id = $3',
            ['accepted', true, userId],
        );
    }

    async rejectUser(userId: string) {
        await this.pool.query(
            'UPDATE users SET account_status = $1 WHERE id = $2',
            ['rejected', userId],
        );
    }
}