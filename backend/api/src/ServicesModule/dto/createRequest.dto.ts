import { ValidateIf, IsOptional, IsInt, IsString, IsArray, IsUrl } from 'class-validator'

export class CreateRequestDto {
    @IsInt()
    jobs_id: number;

    @IsString()
    description: string;

    @IsInt()
    price: number;
}