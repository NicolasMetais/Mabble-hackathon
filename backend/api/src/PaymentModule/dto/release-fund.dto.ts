import { IsNotEmpty, IsString } from 'class-validator';

export class ReleaseFundDto {
    @IsNotEmpty()
    @IsString()
    paymentID: string;
}
