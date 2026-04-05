import { IsString, IsBoolean } from 'class-validator';

export class VoteDto {
    @IsString()
    userToken: string;

    @IsString()
    fromWalletId: string;

    @IsString()
    conflictAddress: string;

    @IsBoolean()
    voteForClient: boolean;
}
