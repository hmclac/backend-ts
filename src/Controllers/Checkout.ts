import { Controller, Get, Post, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource, Repository } from 'typeorm';
import { Checkout } from '../Models';
import { Cache, Equipment } from '../Util/Cache';
import { ToHour } from '../Util/DateTime';

@Controller('checkout')
export class CheckoutController {
  private checkouts: Repository<Checkout>;

  constructor(dataSource: DataSource) {
    this.checkouts = dataSource.getRepository(Checkout);
  }

  @Put('/')
  private async getCheckouts(req: Request, res: Response) {
    if (!req.body) return res.json({ error: 'No body' });
    const body: CheckoutPayload = req.body;
    if (!body.staff_name) return res.json({ error: 'No access' });

    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    const latestCheckouts = await this.checkouts
      .createQueryBuilder('checkout')
      .where('checkout.time_checked_in IS NULL')
      .orderBy('checkout.time_checked_out', 'DESC')
      .getMany();

    if (!latestCheckouts) return res.send({ error: 'Checkout error ' });

    const checkoutData = {};
    for (const c of Cache.equipment) {
      const a = latestCheckouts.find((x) => x.equipment_type === c);

      checkoutData[c] = a
        ? {
            student_name: a.student_name,
            student_id: a.student_id,
            email: a.email,
            time_checked_out: ToHour(Number(a.time_checked_out)),
            rented_staff: a.rented_staff
          }
        : false;
    }

    return res.json(checkoutData);
  }

  @Post('/')
  private async updateCheckouts(req: Request, res: Response) {
    if (!req.body) return res.json({ error: 'No body' });
    const body: CheckoutPayload = req.body;
    if (!body.staff_name) return res.json({ error: 'No access', body });

    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    if (body.update_type === 'rent') {
      if (
        !body.equipment_type ||
        !body.student_id ||
        !body.email ||
        !body.student_name
      )
        return res.json({ error: 'Invalid body, missing fields' });

      if (!Cache.equipment.map((x) => x).includes(body.equipment_type))
        return res.json({ error: 'Invalid body, invalid equipment' });

      const checkout = await this.checkouts
        .createQueryBuilder('checkout')
        .where('checkout.equipment_type = :equipmentType', {
          equipmentType: body.equipment_type
        })
        .andWhere('checkout.time_checked_in IS NULL')
        .getOne();

      if (checkout)
        return res.json({ error: 'Invalid body, equipment already rented' });

      const newCheckout = this.checkouts.create({
        rented_staff: body.staff_name,
        equipment_type: body.equipment_type,
        time_checked_out: String(Date.now()),
        student_id: body.student_id,
        student_name: body.student_name,
        email: body.email
      });

      await this.checkouts.save(newCheckout);

      Cache.setCheckoutUpdate(ToHour(Date.now()));

      return res.status(StatusCodes.CREATED).json({
        message: 'Equipment rented successfully',
        time_checked_out: newCheckout.time_checked_out
      });
    } else if (body.update_type === 'return') {
      if (!body.equipment_type)
        return res.json({ error: 'Invalid body, missing fields' });

      const checkout = await this.checkouts
        .createQueryBuilder('checkout')
        .where('checkout.equipment_type = :equipmentType', {
          equipmentType: body.equipment_type
        })
        .andWhere('checkout.time_checked_in IS NULL')
        .getOne();

      if (!checkout)
        return res.json({
          error: 'Invalid body, equipment not being rented'
        });

      checkout.returned_staff = body.staff_name;
      checkout.time_checked_in = String(Date.now());

      await this.checkouts.update(checkout.id, checkout);

      Cache.setCheckoutUpdate(ToHour(Date.now()));
      return res
        .status(StatusCodes.ACCEPTED)
        .json({ message: 'Equipment returned succcessfully' });
    } else {
      return res.json({ error: 'Invalid body' });
    }
  }
}

export type CheckoutPayload = {
  update_type: 'rent' | 'return';
  staff_name: string;
  equipment_type: string;
  student_id: string;
  email?: string;
  student_name?: string;
};
