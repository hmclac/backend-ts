import { Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

@Controller('helloworld')
export class HelloWorldController {
  @Get('/')
  private helloWorld(req: Request, res: Response) {
    return res.status(StatusCodes.OK).send('Hey boss. How are ya?');
  }
}
