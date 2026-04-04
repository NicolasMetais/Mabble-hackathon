import { IsString, IsNumber, IsInt } from 'class-validator';

export class DisputeDto {
    @IsString()
    userToken: string;

    @IsString()
    fromWalletId: string;

    @IsNumber()
    paymentId: number;   // paymentID on-chain (uint256)

    @IsString()
    solver0: string;     // adresse du premier arbitre

    @IsString()
    solver1: string;     // adresse du second arbitre
}
