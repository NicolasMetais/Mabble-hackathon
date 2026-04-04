import { IsString } from 'class-validator';

// DTO reçu par l'endpoint interne POST /payment/created
// émis par event.ts du microservice payments quand l'event PaymentCreated est capté on-chain
export class PaymentCreatedDto {
    @IsString()
    paymentID: string;          // paymentID on-chain (uint256 → stringifié)

    @IsString()
    to: string;                 // adresse wallet destinataire

    @IsString()
    from: string;               // adresse wallet émetteur

    @IsString()
    amountMBBL: string;         // bigint → string

    @IsString()
    amountUSDC: string;         // bigint → string

    @IsString()
    releaseTimestamp: string;   // bigint → string
}
