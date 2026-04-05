import { Controller, Get, Post, Req, Body, Delete, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ServicesManager } from './services.manager';
import { Public } from 'src/jwt.guard';
import { CreateServiceDto } from './dto/createService.dto';
import { UpdateAServiceDto } from './dto/updateAService.dto';
import { CreateRequestDto } from './dto/createRequest.dto';


@Controller('services')
export class ServicesController {
    constructor(private readonly ServicesManager: ServicesManager) {}

    @Get()
    async getUserServices(@Req() req: any) {
        return this.ServicesManager.getUserServices(req.user.userId);
    };

    @Public()
    @Get('all')
    async getAllServices() {
        return this.ServicesManager.getAllServices();
    };

    @Post()
    async createService(@Req() req: any, @Body() dto: CreateServiceDto) {
        return this.ServicesManager.createService(req.user.userId, dto);
    };

    @Get(':id')
    async getAService(@Param('id', ParseIntPipe) id: number) {
        return this.ServicesManager.getAService(id);
    };

    @Patch(':id')
    async updateAService(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Body() dto: UpdateAServiceDto) {
        return this.ServicesManager.updateAService(id, req.user.userId, dto);
    };

    @Delete(':id')
    async deleteAService(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.ServicesManager.deleteAService(id, req.user.userId);
    };
}
