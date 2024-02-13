import { Controller, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { Protected, Required } from '../Util/Middleware';

@Controller('login')
export class LoginController {
  @Post('/')
  @Protected('staff', 'body')
  private login(req: Request, res: Response) {
    return res.json({ message: 'Successfully logged in' });
  }
}

export type LoginBody = {
  staff_name: string;
};
