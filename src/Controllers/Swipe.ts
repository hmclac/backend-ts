import { Controller, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource, Repository } from 'typeorm';
import { Swipe } from '../Models';
import { Cache } from '../Util/Cache';

@Controller('swipe')
export class SwipeController {
  private swipes: Repository<Swipe>;

  constructor(dataSource: DataSource) {
    this.swipes = dataSource.getRepository(Swipe);
  }

  @Post('/')
  private async updateSwipes(req: Request, res: Response) {
    if (!req.body) return res.json({ error: 'No body' });
    const body: SwipePayload = req.body;
    if (!body.staff_name) return res.json({ error: 'No access' });

    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    if (!body.student_id) return res.json({ error: 'Invalid body' });

    const message = { message: 'Swipe recorded', banned: false };
    if (body.student_id.length < 9) {
      body.student_id = '';
      message.message = 'Invalid swipe';
    }
    const newswipe = this.swipes.create({
      staff_name: body.staff_name,
      student_id: body.student_id,
      time_done: String(Date.now())
    });

    await this.swipes.save(newswipe);

    if (Cache.bans.includes(body.student_id)) {
      message.banned = true;
    }

    return res.json(message);
  }
}

export type SwipePayload = {
  staff_name: string;
  student_id: string;
};
