import { Controller, Get, Post, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource, Repository } from 'typeorm';
import { Bike } from '../Models';
import { Cache } from '../Util/Cache';
import { DateDay, ToHour } from '../Util/DateTime';

@Controller('bikes')
export class BikesController {
  private bikes: Repository<Bike>;

  constructor(dataSource: DataSource) {
    this.bikes = dataSource.getRepository(Bike);
  }

  @Put('/')
  private async getBikes(req: Request, res: Response) {
    if (!req.body) return res.json({ error: 'No body' });
    const body: BikePayload = req.body;
    if (!body.staff_name) return res.json({ error: 'No access' });

    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    const latestBikeRentals = await this.bikes
      .createQueryBuilder('bike')
      .where('bike.bike_number IN (:...bikeNumbers)', {
        bikeNumbers: Cache.bikes
      })
      .andWhere('bike.returned_staff IS NULL')
      .orderBy('bike.time_checked_out', 'DESC')
      .getMany();

    if (!latestBikeRentals) return res.send({ error: 'Bike error ' });

    const bikeData = {};
    for (const b of Cache.bikes) {
      const a = latestBikeRentals.find((x) => x.bike_number === b);
      if (a && a.rented)
        bikeData[b] = {
          rented: a.rented,
          rented_staff: a.rented_staff,
          time_checked_out: DateDay(Number(a.time_checked_out)),
          student_name: a.student_name,
          student_id: a.student_id,
          email: a.email,
          date_due: DateDay(Number(a.date_due)),
          renews: a.renews
        };
      else
        bikeData[b] = {
          rented: false
        };
    }

    return res.json(bikeData);
  }

  @Post('/')
  private async updateBikes(req: Request, res: Response) {
    if (!req.body) return res.json({ error: 'No body' });
    const body: BikePayload = req.body;
    if (!body.staff_name) return res.json({ error: 'No access' });

    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    if (body.update_type === 'rent') {
      if (
        !body.bike_number ||
        !body.student_id ||
        !body.email ||
        !body.student_name
      )
        return res.json({ error: 'Invalid body, missing fields' });

      if (!Cache.bikes.includes(Number(body.bike_number)))
        return res.json({ error: 'Invalid body, invalid bike' });

      if (Cache.bikebans.includes(body.student_id)) {
        return res.json({ error: 'User banned' });
      }

      const bike = await this.bikes.findOneBy({
        bike_number: body.bike_number,
        rented: true
      });

      if (bike) return res.json({ error: 'Invalid body, bike already rented' });

      const now = Date.now();
      const newBike = this.bikes.create({
        rented_staff: body.staff_name,
        bike_number: body.bike_number,
        time_checked_out: String(now),
        date_due: String(now + 86400000),
        student_id: body.student_id,
        student_name: body.student_name,
        email: body.email,
        rented: true,
        renews: 0
      });

      await this.bikes.save(newBike);

      Cache.setBikeUpdate(ToHour(now));

      return res.status(StatusCodes.CREATED).json({
        message: 'Bike rented successfully',
        date_due: DateDay(Number(newBike.date_due))
      });
    } else if (body.update_type === 'return') {
      if (!body.bike_number)
        return res.json({ error: 'Invalid body, missing fields' });

      const bike = await this.bikes.findOneBy({
        bike_number: body.bike_number,
        rented: true
      });

      if (!bike)
        return res.json({ error: 'Invalid body, bike not being rented' });

      bike.returned_staff = body.staff_name;
      bike.time_checked_in = String(Date.now());
      bike.rented = false;

      await this.bikes.update(bike.id, bike);

      Cache.setBikeUpdate(ToHour(Date.now()));
      return res
        .status(StatusCodes.ACCEPTED)
        .json({ message: 'Bike returned succcessfully' });
    } else if (body.update_type === 'renew') {
      if (!body.bike_number)
        return res.json({ error: 'Invalid body, missing fields' });

      const bike = await this.bikes.findOneBy({
        bike_number: body.bike_number,
        rented: true
      });

      if (!bike)
        return res.json({ error: 'Invalid body, bike not being rented' });

      bike.renews++;
      bike.date_due = String(Number(bike.date_due) + 86400000);
      await this.bikes.update(bike.id, bike);
      Cache.setBikeUpdate(ToHour(Date.now()));

      return res.status(StatusCodes.ACCEPTED).json({
        message: 'Bike renewed succcessfully',
        date_due: DateDay(Number(bike.date_due))
      });
    } else {
      return res.json({ error: 'Invalid body' });
    }
  }
}

export type BikePayload = {
  update_type: 'rent' | 'return';
  staff_name: string;
  bike_number: number;
  date_due?: number;
  student_id: string;
  email?: string;
  student_name?: string;
};
