import { Controller, Get } from '@nestjs/common';
import { TestService } from './test.service';
import { Public } from 'src/jwt.guard';


@Controller()
export class TestController {
    constructor(private readonly testService: TestService) {}

  // @Public()
  @Get('ping')
  async ping() {
    console.log("Ca passe bien dans le backend");

    const paymentsResponse = await this.testService.pingPayments();
    console.log(paymentsResponse);

    const dbRows = await this.testService.pingDatabase();
    console.log(dbRows);

    return { message: 'pong' };
  }
}
