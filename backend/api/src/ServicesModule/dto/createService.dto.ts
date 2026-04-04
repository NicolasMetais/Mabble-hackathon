import { ValidateIf, IsOptional, IsInt, IsString, IsArray, IsUrl } from 'class-validator'

export class CreateServiceDto {
    @IsInt()
    jobs_id: number;

    @IsString()
    description: string;

    @IsInt()
    price: number;
}