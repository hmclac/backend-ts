import { Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import { Swipe } from '../Models';
import * as moment from 'moment-timezone';

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
      const date = moment.tz(hourStart, 'America/Los_Angeles');
      const key = `${date.format('HH:mm MM/DD/YYYY')}`;
      countsPerHour[key] = 0;
    }

    for (const swipe of swipes) {
      const swipeTime = Number(swipe.time_done);
      const hourIndex = Math.floor((swipeTime - start) / oneHourInMillis);
      const hourWindowStart = moment.tz(
        start + hourIndex * oneHourInMillis,
        'America/Los_Angeles'
      );
      const key = hourWindowStart.format('HH:mm MM/DD/YYYY');
      if (countsPerHour[key]) {
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
      return res.status(400).json({ error: 'Invalid query parameters' });

    try {
      const { data, labels } = await this.getData(
        Number(query.date_start),
        Number(query.date_end)
      );
      return res.status(200).json({ data, labels });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

type SwipePayload = {
  date_start: string;
  date_end: string;
};
