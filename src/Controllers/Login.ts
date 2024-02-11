import { Controller, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Cache } from '../Util/Cache';

@Controller('login')
export class LoginController {
  @Post('/')
  private login(req: Request, res: Response) {
    if (!req.body) return res.json({ error: 'No body' });
    const body: LoginBody = req.body;

    if (!body.staff_name) return res.json({ error: 'Invalid body' });

    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'Invalid staff' });

    return res.json({ message: 'Successfully logged in' });
  }
}

export type LoginBody = {
  staff_name: string;
};
