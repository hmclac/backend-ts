import { Controller, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource, Repository } from 'typeorm';
import { Headcount } from '../Models';
import { Cache } from '../Util/Cache';

import { NowHour, NowMS, ToHour } from '../Util/DateTime';
import { Protected, Required } from '../Util/Middleware';

@Controller('headcount')
export class HeadcountController {
  private headcounts: Repository<Headcount>;

  constructor(dataSource: DataSource) {
    this.headcounts = dataSource.getRepository(Headcount);
  }

  @Post('/')
  @Protected('staff', 'body')
  @Required(
    'body',
    'weight_room',
    'gym',
    'aerobics_room',
    'lobby',
    'weight_reserved',
    'gym_reserved',
    'aerobics_reserved'
  )
  private async updateHeadcount(req: Request, res: Response) {
    const body: HeadcountPayload = req.body;
    const {
      staff_name,
      weight_room,
      gym,
      aerobics_room,
      lobby,
      weight_reserved,
      gym_reserved,
      aerobics_reserved
    } = body;

    const newhead = this.headcounts.create({
      staff_name,
      weight_room,
      gym,
      aerobics_room,
      lobby,
      weight_reserved,
      gym_reserved,
      aerobics_reserved,
      time_done: NowMS()
    });

    await this.headcounts.save(newhead);

    Cache.addOccupancy('weight_room', {
      time: NowHour(),
      count: weight_room
    });
    Cache.addOccupancy('gym', {
      time: NowHour(),
      count: gym
    });
    Cache.addOccupancy('aerobics_room', {
      time: NowHour(),
      count: aerobics_room
    });
    Cache.addOccupancy('lobby', {
      time: NowHour(),
      count: lobby
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
