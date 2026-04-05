import { IsString, IsNumber } from 'class-validator';

export class WithdrawDto {
    @IsString()
    _userWalletID: string;

    @IsString()
    _userToken: string;

    @IsString() // or IsNumber if it's sent as int, but Circle uses arrays of strings or contract interactions might use BigInt. Let's use any or String since it maps to paymentId.
    _paymentId: any;
}
