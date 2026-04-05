import { IsOptional, IsInt, IsString, IsNumber } from 'class-validator'

export class CreateServiceDto {
    @IsInt()
    jobs_id: number;

    @IsString()
    description: string;

    @IsNumber()
    amountMBBL: number;

    @IsNumber()
    amountUSDC: number;
}