import { IsString } from 'class-validator'

export class UserTokenDto {
    @IsString()
    userToken: string;
}