import { Controller, Post, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource, Repository } from 'typeorm';
import { Swipe } from '../Models';
import { Cache } from '../Util/Cache';

@Controller('history')
export class HistoryController {
  private swipes: Repository<Swipe>;

  constructor(dataSource: DataSource) {
    this.swipes = dataSource.getRepository(Swipe);
  }

  private async getData(startDate: number, endDate: number) {
    const swipes = await this.swipes
      .createQueryBuilder('swipe')
      .where(
        'CAST(swipe.time_done AS BIGINT) >= :startDate AND CAST(swipe.time_done AS BIGINT) <= :endDate',
        {
          startDate,
          endDate
        }
      )
      .orderBy('swipe.time_done', 'DESC')
      .getMany();

    const start = Number(startDate);
    const end = Number(endDate);
    const countsPerHour: { [key: string]: number } = {};
    const oneHourInMillis = 3600 * 1000;

    for (let hourStart = start; hourStart < end; hourStart += oneHourInMillis) {
      const date = new Date(hourStart);
      const key = `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')} ${
        date.getMonth() + 1
      }/${date.getDate()}/${date.getFullYear()}`;
      countsPerHour[key] = 0;
    }

    for (const swipe of swipes) {
      const swipeTime = Number(swipe.time_done);
      const hourIndex = Math.floor((swipeTime - start) / oneHourInMillis);
      const hourWindowStart = new Date(start + hourIndex * oneHourInMillis);
      const key = `${hourWindowStart
        .getHours()
        .toString()
        .padStart(2, '0')}:${hourWindowStart
        .getMinutes()
        .toString()
        .padStart(2, '0')} ${
        hourWindowStart.getMonth() + 1
      }/${hourWindowStart.getDate()}/${hourWindowStart.getFullYear()}`;
      if (countsPerHour[key] !== undefined) {
        countsPerHour[key]++;
      }
    }

    return {
      labels: Object.keys(countsPerHour).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      ),
      data: Object.keys(countsPerHour)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map((key) => countsPerHour[key])
    };
  }

  @Get('/')
  private async getSwipes(req: Request, res: Response) {
    const query = req.query as SwipePayload;
    if (!query || !query.date_start || !query.date_end)
      return res.json({ error: 'Invalid body' });

    try {
      const { data, labels } = await this.getData(
        Number(query.date_start),
        Number(query.date_end)
      );
      return res.json({ data, labels });
    } catch (e) {
      console.log(e);
      return res.json({ error: e });
    }
  }
}

type SwipePayload = {
  date_start: string;
  date_end: string;
};
