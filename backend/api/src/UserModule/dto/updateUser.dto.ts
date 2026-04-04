import { IsOptional, IsInt, IsString, IsEmail, IsUrl } from 'class-validator'

export class updateUserDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsOptional()
    @IsUrl()
    github_url?: string;

    @IsOptional()
    @IsInt()
    jobs_id?: number;

    @IsOptional()
    @IsString()
    other_jobs?: string;

    @IsOptional()
    @IsString()
    description?: string;

}
