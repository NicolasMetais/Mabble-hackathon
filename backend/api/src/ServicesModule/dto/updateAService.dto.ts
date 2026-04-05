import { ValidateIf, IsOptional, IsInt, IsString, IsArray, IsUrl } from 'class-validator'

export class UpdateAServiceDto {
    @IsOptional()
    @IsInt()
    jobs_id: number;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsInt()
    amountMBBL: number;

    @IsOptional()
    @IsInt()
    amountUSDC: number;
}