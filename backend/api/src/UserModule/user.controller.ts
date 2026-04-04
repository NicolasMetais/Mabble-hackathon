import { Controller, Post, Body, Req, Patch, Get, ParseIntPipe, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { Public } from 'src/jwt.guard';
import { updateUserDto } from './dto/updateUser.dto';
import { updatePasswordDto } from './dto/updatePass.dto';


@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Patch('me')
    async updateUser(@Req() req: any, @Body() dto : updateUserDto) {
        return this.userService.updateUser(req.user.userId, dto);
    }

    @Patch('me/password')
    async updatePassword(@Req() req: any, @Body() dto : updatePasswordDto) {
        return this.userService.updatePassword(req.user.userId, dto);
    }

    @Get('me')
    async getUserById(@Req() req: any) {
        return this.userService.getUserById(req.user.userId);
    }

    @Get(':id')
    async getPublicUserById(@Param('id') id : string) {
        return this.userService.getPublicUserById(id);
    }

}
