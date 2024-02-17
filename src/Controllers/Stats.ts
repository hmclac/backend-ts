import { Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import { Swipe } from '../Models';
import { Required } from '../Util/Middleware';
import { HHMM, HHMMDDYY, OneMonthAgo } from '../Util/DateTime';

@Controller('stats')
export class StatsController {
  private swipes: Repository<Swipe>;

  constructor(dataSource: DataSource) {
    this.swipes = dataSource.getRepository(Swipe);
  }

  private async getData(startDate: number, endDate?: number) {
    const start = Number(startDate);
    const oneHourInMillis = 3600 * 1000;
    const countsPerHour: { [key: string]: number } = {};

    if (endDate) {
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

      const end = Number(endDate);

      for (let hourStart = start; hourStart < end; hourStart += oneHourInMillis)
        countsPerHour[HHMMDDYY(hourStart)] = 0;

      for (const swipe of swipes) {
        const hourIndex = Math.floor(
          (Number(swipe.time_done) - start) / oneHourInMillis
        );
        const key = HHMMDDYY(start + hourIndex * oneHourInMillis);

        if (countsPerHour[key] !== undefined) countsPerHour[key]++;
      }
    } else {
      endDate = startDate + oneHourInMillis * 24;
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

      for (
        let hourStart = start;
        hourStart < endDate;
        hourStart += oneHourInMillis
      )
        countsPerHour[HHMM(hourStart)] = 0;

      for (const swipe of swipes) {
        const hourIndex = Math.floor(
          (Number(swipe.time_done) - start) / oneHourInMillis
        );
        const key = HHMM(start + hourIndex * oneHourInMillis);

        if (countsPerHour[key] !== undefined) countsPerHour[key]++;
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

  @Get('swipes')
  @Required('query', 'date_start', 'range')
  private async getSwipes(req: Request, res: Response) {
    const query = req.query as SwipePayload;

    if (query.range === 'true') {
      const { date_start, date_end } = query;
      if (!date_end) {
        return res.json({ error: 'Missing date end field' });
      }
      try {
        const { data, labels } = await this.getData(
          Number(date_start),
          Number(date_end)
        );

        return res.status(200).json({ data, labels });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      const { date_start } = query;
      try {
        const { data, labels } = await this.getData(Number(date_start));

        return res.status(200).json({ data, labels });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  @Get('leaderboard')
  private async getLeaderboard(req: Request, res: Response) {
    const swipeCounts: { staff_name: string; count: string }[] =
      await this.swipes
        .createQueryBuilder('swipe')
        .select('swipe.staff_name', 'staff_name')
        .addSelect('COUNT(*)', 'count')
        .where('CAST(swipe.time_done AS BIGINT) > :oneMonthAgo', {
          oneMonthAgo: OneMonthAgo()
        })
        .groupBy('swipe.staff_name')
        .getRawMany();

    return res.json(swipeCounts.map((x) => ({ ...x, count: Number(x.count) })));
  }
}
type SwipePayload = {
  date_start: string;
  date_end: string;
  range: string;
};
