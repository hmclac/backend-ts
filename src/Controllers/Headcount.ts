import { Controller, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource, Repository } from 'typeorm';
import { Headcount } from '../Models';
import { Cache } from '../Util/Cache';

import { NowHour, NowMS, ToHour } from '../Util/DateTime';

@Controller('headcount')
export class HeadcountController {
  private headcounts: Repository<Headcount>;

  constructor(dataSource: DataSource) {
    this.headcounts = dataSource.getRepository(Headcount);
  }

  @Post('/')
  private async updateHeadcount(req: Request, res: Response) {
    if (!req.body) return res.json({ error: 'No body' });
    const body: HeadcountPayload = req.body;
    if (!body.staff_name) return res.json({ error: 'No access' });

    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    const newhead = this.headcounts.create({
      staff_name: body.staff_name,
      weight_room: body.weight_room || 0,
      gym: body.gym || 0,
      aerobics_room: body.aerobics_room || 0,
      lobby: body.lobby || 0,
      weight_reserved: body.weight_reserved || false,
      gym_reserved: body.gym_reserved || false,
      aerobics_reserved: body.aerobics_reserved || false,
      time_done: NowMS()
    });

    await this.headcounts.save(newhead);

    Cache.addOccupancy('weight_room', {
      time: NowHour(),
      count: body.weight_room
    });
    Cache.addOccupancy('gym', {
      time: NowHour(),
      count: body.gym
    });
    Cache.addOccupancy('aerobics_room', {
      time: NowHour(),
      count: body.aerobics_room
    });
    Cache.addOccupancy('lobby', {
      time: NowHour(),
      count: body.lobby
    });

    return res
      .status(StatusCodes.CREATED)
      .json({ message: 'Successfully recorded headcount' });
  }
}

export type HeadcountPayload = {
  staff_name: string;
  weight_room: number;
  gym: number;
  aerobics_room: number;
  lobby: number;
  weight_reserved: boolean;
  gym_reserved: boolean;
  aerobics_reserved: boolean;
};
