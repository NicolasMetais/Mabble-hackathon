import { ValidateIf, IsOptional, IsInt, IsString, IsArray, IsUrl } from 'class-validator'

export class AdmissionDto {
    @IsUrl()
    @IsOptional()
    portfolio_url?: string;

    @IsArray()
    @IsString({ each: true })
    skills: string[];

    @IsString()
    presentation: string;
}