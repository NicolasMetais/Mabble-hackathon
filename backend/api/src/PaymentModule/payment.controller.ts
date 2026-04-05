import { Controller, Post, Body, Req, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PayDto } from './dto/pay.dto';
import { DisputeDto } from './dto/dispute.dto';
import { PaymentCreatedDto } from './dto/payment-created.dto';
import { ReleaseFundDto } from './dto/release-fund.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { VoteDto } from './dto/vote.dto';
import { Public } from '../jwt.guard';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    // Exposé au front — JWT requis
    @Post('pay')
    async pay(@Req() req: any, @Body() dto: PayDto) {
        return this.paymentService.pay(req.user.userId, dto);
    }

    // Exposé au front — JWT requis
    @Post('dispute')
    async dispute(@Req() req: any, @Body() dto: DisputeDto) {
        return this.paymentService.dispute(req.user.userId, dto);
    }

    @Get('transactions')
    async getTransactions(@Req() req: any) {
        return this.paymentService.getTransactions(req.user.userId);
    }

    @Get('arbitrations')
    async getArbitrations(@Req() req: any) {
        return this.paymentService.getArbitrations(req.user.userId);
    }

    @Post('withdraw')
    async withdraw(@Req() req: any, @Body() dto: WithdrawDto) {
        return this.paymentService.withdraw(req.user.userId, dto);
    }

    @Post('vote')
    async vote(@Req() req: any, @Body() dto: VoteDto) {
        return this.paymentService.vote(req.user.userId, dto);
    }

    // Route interne — appelée par event.ts du microservice payments (pas de JWT)
    @Public()
    @Post('created')
    async paymentCreated(@Body() dto: PaymentCreatedDto) {
        return this.paymentService.onPaymentCreated(dto);
    }

    // Route interne — appelée par event.ts quand le paiement peut être retiré (ReleaseFund)
    @Public()
    @Post('releaseFund')
    async releaseFund(@Body() dto: ReleaseFundDto) {
        return this.paymentService.onReleaseFund(dto);
    }

    // Route interne — appelée par event.ts quand un conflit est résolu (pas de JWT)
    @Public()
    @Post('conflictResolved')
    async conflictResolved(@Body() body: { paymentID: string; solver0: string; solver1: string; refundAddrees: string }) {
        return this.paymentService.onConflictResolved(body);
    }

    // Route interne — appelée par event.ts quand le contrat de conflit est créé
    @Public()
    @Post('conflictCreated')
    async conflictCreated(@Body() body: { paymentID: string; conflictAddress: string }) {
        return this.paymentService.onConflictCreated(body);
    }
}
