import { Controller, Get, Post, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource, Repository } from 'typeorm';
import { Checkout } from '../Models';
import { Cache } from '../Util/Cache';
import { ToHour } from '../Util/DateTime';
import { Protected, Required } from '../Util/Middleware';

@Controller('checkout')
export class CheckoutController {
  private checkouts: Repository<Checkout>;

  constructor(dataSource: DataSource) {
    this.checkouts = dataSource.getRepository(Checkout);
  }

  @Put('/')
  @Protected('staff', 'body')
  private async getCheckouts(req: Request, res: Response) {
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
  @Protected('staff', 'body')
  @Required('body', 'update_type', 'equipment_type')
  private async updateCheckouts(req: Request, res: Response) {
    const body: CheckoutPayload = req.body;
    const { update_type, equipment_type, staff_name } = body;
    if (update_type === 'rent') {
      const { student_id, email, student_name } = body;
      if (!student_id || !email || !student_name)
        return res.json({ error: 'Invalid body, missing fields' });

      if (!Cache.equipment.map((x) => x).includes(equipment_type))
        return res.json({ error: 'Invalid body, invalid equipment' });

      const checkout = await this.checkouts
        .createQueryBuilder('checkout')
        .where('checkout.equipment_type = :equipmentType', {
          equipmentType: equipment_type
        })
        .andWhere('checkout.time_checked_in IS NULL')
        .getOne();

      if (checkout)
        return res.json({ error: 'Invalid body, equipment already rented' });

      const newCheckout = this.checkouts.create({
        rented_staff: staff_name,
        equipment_type,
        time_checked_out: String(Date.now()),
        student_id,
        student_name,
        email
      });

      await this.checkouts.save(newCheckout);

      Cache.setCheckoutUpdate(ToHour(Date.now()));

      return res.status(StatusCodes.CREATED).json({
        message: 'Equipment rented successfully',
        time_checked_out: newCheckout.time_checked_out
      });
    } else if (body.update_type === 'return') {
      const checkout = await this.checkouts
        .createQueryBuilder('checkout')
        .where('checkout.equipment_type = :equipmentType', {
          equipmentType: equipment_type
        })
        .andWhere('checkout.time_checked_in IS NULL')
        .getOne();

      if (!checkout)
        return res.json({
          error: 'Invalid body, equipment not being rented'
        });

      checkout.returned_staff = staff_name;
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
  student_id?: string;
  email?: string;
  student_name?: string;
};
