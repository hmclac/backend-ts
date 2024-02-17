import { Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import {
  // Admin, Swipe,
  Bike,
  Checkout,
  Headcount
} from '../Models';
import { Cache } from '../Util/Cache';
import { DateHour, NowSinceHour, ToHour, startOfDay } from '../Util/DateTime';

@Controller('/')
export class HomeController {
  private bikes: Repository<Bike>;
  private checkouts: Repository<Checkout>;
  // private admins: Repository<Admin>;
  private headcounts: Repository<Headcount>;
  // private swipes: Repository<Swipe>;

  public setup = false;

  constructor(dataSource: DataSource) {
    // this.admins = dataSource.getRepository(Admin);
    this.bikes = dataSource.getRepository(Bike);
    this.checkouts = dataSource.getRepository(Checkout);
    this.headcounts = dataSource.getRepository(Headcount);
    Cache.setup();
  }
  @Get('/')
  private async getHome(req: Request, res: Response) {
    const latestBikeRentals = await this.bikes
      .createQueryBuilder('bike')
      .where('bike.bike_number IN (:...bikeNumbers)', {
        bikeNumbers: Cache.bikes
      })
      .andWhere('bike.returned_staff IS NULL')
      .orderBy('bike.time_checked_out', 'DESC')
      .getMany();

    const latestCheckouts = await this.checkouts
      .createQueryBuilder('checkout')
      .where('checkout.time_checked_in IS NULL')
      .orderBy('checkout.time_checked_out', 'DESC')
      .getMany();

    // Convert startOfDay to a timestamp or format suitable for your database query
    const startOfDayTimestamp = startOfDay.toMillis();
    const headcounts = await this.headcounts
      .createQueryBuilder('headcount')
      .where('headcount.time_done >= :startOfDay', {
        startOfDay: startOfDayTimestamp
      })
      .orderBy('headcount.time_done', 'DESC')
      .getMany();

    // Assuming DateHour is imported or defined elsewhere
    // and assuming headcounts is an array of headcount entities
    const headcount_labels = headcounts
      .map((hc) => ToHour(Number(hc.time_done)))
      .reverse();

    // Assuming latestHeadcount is the first item of the sorted headcounts array
    const latestHeadcount = headcounts[0];

    const bikeData = {};
    for (const b of Cache.bikes) {
      if (latestBikeRentals) {
        const a = latestBikeRentals.find((x) => x.bike_number === b);

        bikeData[b] = a ? { checked_out_for: a.time_checked_out } : false;
      } else bikeData[b] = false;
    }

    const checkoutData = {};
    for (const c of Cache.equipment) {
      if (latestCheckouts) {
        const a = latestCheckouts.find((x) => x.equipment_type === c);

        checkoutData[c] = a
          ? {
              checked_out_for: NowSinceHour(a.time_checked_out)
            }
          : false;
      } else checkoutData[c] = false;
    }

    return res.json({
      headcount_labels,
      weightRoom: {
        reserved: latestHeadcount ? latestHeadcount.weight_reserved : false,
        count: latestHeadcount ? latestHeadcount.weight_room : 0,
        data: headcounts.map((hc) => hc.weight_room).reverse()
      },
      gym: {
        reserved: latestHeadcount ? latestHeadcount.gym_reserved : false,
        count: latestHeadcount ? latestHeadcount.gym : 0,
        data: headcounts.map((hc) => hc.gym).reverse()
      },
      aerobics: {
        reserved: latestHeadcount ? latestHeadcount.aerobics_reserved : false,
        count: latestHeadcount ? latestHeadcount.aerobics_room : 0,
        data: headcounts.map((hc) => hc.aerobics_room).reverse()
      },
      lobby: {
        count: latestHeadcount ? latestHeadcount.lobby : 0,
        data: headcounts.map((hc) => hc.lobby).reverse()
      },
      checkout: checkoutData || [],
      bikes: bikeData || [],
      bikeUpdate: Cache.bikeupdate || '',
      checkoutUpdate: Cache.checkoutupdate || ''
    });
  }
}
