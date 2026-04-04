import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AdmissionDto } from './dto/admission.dto';
import { Public } from '../jwt.guard';
import { UserTokenDto } from './dto/InitializeWallet.dto';



@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) {} //je cree l'instance du service pour pouvoir l'utiliser

    @Public()
    @Post('signup')
    async signup(@Body() dto : SignupDto) {
        return this.authService.signup(dto);
    }

    @Public()
    @Post('login')
    async signin(@Body() dto : LoginDto) {
        return this.authService.login(dto);
    }

    @Post('admission')
    async admission(@Req() req: any, @Body() dto : AdmissionDto) {
        return this.authService.admission(req.user.userId, dto);
    }

    @Post('initializeWallet')
    async initializeWallet(@Body() dto : UserTokenDto) {
        return this.authService.initializeWallet(dto);

    }

    @Post('addWallet')
    async addWallet(@Req() req: any, @Body() dto : UserTokenDto) {
        return this.authService.addWallet(req.user.userId, dto);
    }

    @Post('getWallet')
    async getWallet(@Req() req: any) {
        return this.authService.getWallet(req.user.userId);

    }
}
