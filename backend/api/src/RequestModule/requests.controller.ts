import { Controller, Get, Post, Req, Body, Delete, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { Public } from 'src/jwt.guard';
import { CreateRequestDto } from './dto/createRequest.dto';


@Controller('requests')
export class RequestsController {
    constructor(private readonly RequestsService: RequestsService) {}

    @Post('service/:id')
    async createRequest(@Param('id', ParseIntPipe) id : number, @Req() req: any, @Body() dto : CreateRequestDto) {
            return this.RequestsService.createRequest(id, req.user.userId, dto);
    }

    @Patch(':id/reject')
    async rejectRequest(@Param('id', ParseIntPipe) id : number, @Req() req: any) {
            return this.RequestsService.rejectRequest(id, req.user.userId);
    }

    @Patch(':id/accept')
    async acceptRequest(@Param('id', ParseIntPipe) id : number, @Req() req: any) {
            return this.RequestsService.acceptRequest(id, req.user.userId);
    }

    @Patch(':id/finish')
    async finishRequest(@Param('id', ParseIntPipe) id : number, @Req() req: any) {
            return this.RequestsService.finishRequest(id, req.user.userId);
    }

    @Get(':id')
    async getRequest(@Param('id', ParseIntPipe) id : number) {
        return this.RequestsService.getRequest(id);
    }

    @Get('user/:id')
    async getUserRequests(@Param('id') id : string) {
        return this.RequestsService.getUserRequests(id);
    }

    @Get('service/:id')
    async getServiceRequests(@Param('id', ParseIntPipe) id : number) {
        return this.RequestsService.getServiceRequests(id);
    }
}
