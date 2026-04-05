import { IsString, IsNumber, IsOptional, IsPositive, Min, IsInt } from 'class-validator';

export class PayDto {
    @IsString()
    userToken: string;

    @IsString()
    fromWalletAddress: string;

    @IsString()
    fromWalletID: string;

    @IsString()
    to: string;          // adresse wallet du destinataire (provider)

    @IsNumber()
    @Min(0)
    USDCValue: number;

    @IsNumber()
    @Min(0)
    MBBLValue: number;

    @IsInt()
    requestId: number;   // id de la request_services associée
}
