import { Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import { Admin, Bike, Checkout, Headcount, Swipe } from '../Models';
import { Cache } from '../Util/Cache';
import { NowSinceHour, ToHour } from '../Util/DateTime';

@Controller('/')
export class HomeController {
  private bikes: Repository<Bike>;
  private checkouts: Repository<Checkout>;
  private admins: Repository<Admin>;
  private headcounts: Repository<Headcount>;
  // private swipes: Repository<Swipe>;

  public setup = false;

  constructor(dataSource: DataSource) {
    this.admins = dataSource.getRepository(Admin);
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

    const latestHeadcount = await this.headcounts
      .createQueryBuilder('headcount')
      .orderBy('headcount.time_done', 'DESC')
      .getOne();

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

    const weightData = Cache.occupancy('weight_room');
    const gymData = Cache.occupancy('gym');
    const aerobicsData = Cache.occupancy('aerobics_room');
    const lobbyData = Cache.occupancy('lobby');

    return res.json({
      headcount_last_updated: ToHour(
        Number(latestHeadcount ? latestHeadcount.time_done : '0')
      ),
      weightRoom: {
        reserved: latestHeadcount ? latestHeadcount.weight_reserved : false,
        count: latestHeadcount ? latestHeadcount.weight_room : 0,
        data: weightData || []
      },
      gym: {
        reserved: latestHeadcount ? latestHeadcount.gym_reserved : false,
        count: latestHeadcount ? latestHeadcount.gym : 0,
        data: gymData || []
      },
      aerobics: {
        reserved: latestHeadcount ? latestHeadcount.aerobics_reserved : false,
        count: latestHeadcount ? latestHeadcount.aerobics_room : 0,
        data: aerobicsData || []
      },
      lobby: {
        count: latestHeadcount ? latestHeadcount.lobby : 0,
        data: lobbyData || []
      },
      checkout: checkoutData || [],
      bikes: bikeData || [],
      bikeUpdate: Cache.bikeupdate || '',
      checkoutUpdate: Cache.checkoutupdate || ''
    });
  }
}
