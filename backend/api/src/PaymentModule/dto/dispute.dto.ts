import { IsString, IsNumber, IsInt } from 'class-validator';

export class DisputeDto {
    @IsString()
    userToken: string;

    @IsString()
    fromWalletId: string;

    @IsNumber()
    paymentId: number;   // paymentID on-chain (uint256)

}
