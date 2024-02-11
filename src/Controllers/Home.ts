import { Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
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
    // this.swipes = dataSource.getRepository(Swipe);
  }
  @Get('/')
  private async getHome(req: Request, res: Response) {
    try {
      const ad = await this.admins.findOneBy({ id: 1 });
    } catch (e) {
      console.log(e);
    }
    const message: { errors: string[]; message: string } = {
      errors: [],
      message: ''
    };
    const latestBikeRentals = await this.bikes
      .createQueryBuilder('bike')
      .where('bike.bike_number IN (:...bikeNumbers)', {
        bikeNumbers: Cache.bikes
      })
      .andWhere('bike.returned_staff IS NULL')
      .orderBy('bike.time_checked_out', 'DESC')
      .getMany();

    if (!latestBikeRentals) return res.send({ error: 'Bike error ' });
    const latestCheckouts = await this.checkouts
      .createQueryBuilder('checkout')
      .where('checkout.time_checked_in IS NULL')
      .orderBy('checkout.time_checked_out', 'DESC')
      .getMany();
    if (!latestCheckouts) return res.send({ error: 'Checkout error ' });
    const latestHeadcount = await this.headcounts
      .createQueryBuilder('headcount')
      .orderBy('headcount.time_done', 'DESC')
      .getOne();

    if (!latestHeadcount) return res.send({ error: 'Headcount error ' });

    const {
      weight_room,
      gym,
      aerobics_room,
      lobby,
      weight_reserved,
      gym_reserved,
      aerobics_reserved
    } = latestHeadcount;

    const bikeData = {};
    for (const b of Cache.bikes) {
      const a = latestBikeRentals.find((x) => x.bike_number === b);
      bikeData[b] = a ? { checked_out_for: a.time_checked_out } : false;
    }

    const checkoutData = {};
    for (const c of Cache.equipment) {
      const a = latestCheckouts.find((x) => x.equipment_type === c);

      // console.log(a?.time_checked_out || 'a');
      checkoutData[c] = a
        ? {
            checked_out_for: NowSinceHour(a.time_checked_out)
          }
        : false;
    }

    const weightData = Cache.occupancy('weight_room');
    const gymData = Cache.occupancy('gym');
    const aerobicsData = Cache.occupancy('aerobics_room');
    const lobbyData = Cache.occupancy('lobby');

    return res.json({
      headcount_last_updated: ToHour(Number(latestHeadcount.time_done)),
      weightRoom: {
        reserved: weight_reserved,
        count: weight_room,
        data: weightData
      },
      gym: { reserved: gym_reserved, count: gym, data: gymData },
      aerobics: {
        reserved: aerobics_reserved,
        count: aerobics_room,
        data: aerobicsData
      },
      lobby: { count: lobby, data: lobbyData },
      checkout: checkoutData,
      bikes: bikeData,
      bikeUpdate: Cache.bikeupdate,
      checkoutUpdate: Cache.checkoutupdate
    });
  }
}
