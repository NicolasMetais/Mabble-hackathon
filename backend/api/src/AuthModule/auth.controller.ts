import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AdmissionDto } from './dto/admission.dto';
import { Public } from '../jwt.guard';



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

    @Post('getUserChallenge')
    async getuserChallenge() {
        return this.authService.getUserChallenge();

    }

    @Post('getWallet')
    async getWallet(@Req() req: any) {
        return this.authService.getWallet(req.user.userId);

    }
}
