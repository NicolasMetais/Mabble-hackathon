import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
    controllers: [PaymentController],
    providers: [PaymentService],
    // DatabaseModule est @Global() — pas besoin de l'importer ici
})
export class PaymentModule {}
