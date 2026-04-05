import { ValidateIf, IsOptional, IsNumber, IsString, IsArray, IsUrl } from 'class-validator'

export class CreateRequestDto {
    @IsString()
    description: string;

    @IsNumber()
    amountMBBL: number;

    @IsNumber()
    amountUSDC: number;
}