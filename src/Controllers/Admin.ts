import { Controller, Get, Post, Delete } from '@overnightjs/core';
import { Request, Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import { Admin } from '../Models/Admin';
import { Bike, Cache, Equipment, StaffMember } from '../Util/Cache';
import { Protected, Required } from '../Util/Middleware';

@Controller('admin')
export class AdminController {
  private admins: Repository<Admin>;
  public setup = false;

  constructor(dataSource: DataSource) {
    this.admins = dataSource.getRepository(Admin);
    Cache.setup();
    this.init();
  }

  private async init() {
    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) {
      const newad = this.admins.create({
        id: 1,
        staff: ['lacsup123'],
        equipment: [
          'pool1',
          'pool2',
          'pingpong1',
          'pingpong2',
          'basketball',
          'volleyball'
        ],
        bikes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 69],
        banlist: [],
        bikebans: []
      });

      await this.admins.save(newad);

      this.setup = true;
      return false;
    }
    if (!ad.bikes || !ad.equipment || !ad.staff) {
      throw 'uh oh';
    }
    Cache.setBikes(ad.bikes);
    Cache.setEquipment(ad.equipment);
    Cache.setStaff(ad.staff);
    Cache.setBans(ad.banlist);
    Cache.setBikeBans(ad.bikebans);
    this.setup = true;
    return true;
  }

  // @Get('reset')
  // private async resetCache(req: Request, res: Response) {
  //   if (!Cache.staff.includes(req.body.staff_name))
  //     return res.json({ error: 'No access' });

  //   await this.init();
  //   return res.json({ message: 'Success' });
  // }

  @Get('/')
  @Protected('admin', 'query')
  private async getInfo(req: Request, res: Response) {
    if (!this.setup) return;
    const { bikes, staff, equipment, bans, bikebans } = Cache;

    return res.json({
      bikes,
      staff,
      equipment,
      bans,
      bikebans
    });
  }

  @Post('staff')
  @Protected('admin', 'body')
  @Required('body', 'staff')
  private async updateStaff(req: Request, res: Response) {
    if (!this.setup) return;

    const body: AdminPayload = req.body;
    const staff = body.staff!;

    if (Cache.staff.includes(staff))
      return res.json({ error: 'Staff already added' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.staff.push(staff);

    await this.admins.save(ad);

    Cache.addStaff(staff);

    return res.json({ message: 'Staff member added', staff: ad.staff });
  }

  @Delete('staff')
  @Protected('admin', 'body')
  @Required('body', 'staff')
  private async removeStaff(req: Request, res: Response) {
    if (!this.setup) return;

    if (Cache.staff.length === 1) {
      return res.json({ error: "Can't delete last staff member" });
    }
    const body: AdminPayload = req.body;
    const staff = body.staff!;

    if (!Cache.staff.includes(staff))
      return res.json({ error: 'Staff not added' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.staff = ad.staff.filter((x) => x !== staff);

    await this.admins.save(ad);

    Cache.removeStaff(staff);

    return res.json({ message: 'Staff member removed', staff: ad.staff });
  }

  @Post('equipment')
  @Protected('admin', 'body')
  @Required('body', 'equipment')
  private async updateEquipment(req: Request, res: Response) {
    if (!this.setup) return;

    const body: AdminPayload = req.body;
    const equipment = body.equipment!;

    if (Cache.equipment.includes(equipment))
      return res.json({ error: 'Equipment with that name already exists' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.equipment.push(equipment);

    await this.admins.save(ad);

    Cache.addEquipment(equipment);

    return res.json({ message: 'Equipment added', equipment: ad.equipment });
  }

  @Delete('equipment')
  @Protected('admin', 'body')
  @Required('body', 'equipment')
  private async removeEquipment(req: Request, res: Response) {
    if (!this.setup) return;

    const body: AdminPayload = req.body;
    const equipment = body.equipment!;

    if (!Cache.equipment.includes(equipment))
      return res.json({ error: 'No existing equipment with that name' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.equipment = ad.equipment.filter((x) => x !== equipment);

    await this.admins.save(ad);

    Cache.removeEquipment(equipment);

    return res.json({ message: 'Equipment removed', equipment: ad.equipment });
  }

  @Post('bikes')
  @Protected('admin', 'body')
  @Required('body', 'bike')
  private async updateBikes(req: Request, res: Response) {
    if (!this.setup) return;

    const body: AdminPayload = req.body;
    const bike = Number(body.bike!);

    if (Cache.bikes.includes(bike))
      return res.json({ error: 'Bike with that number already exists' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.bikes.push(bike);

    await this.admins.save(ad);

    Cache.addBike(bike);

    return res.json({ message: 'Bike added', bikes: ad.bikes });
  }

  @Delete('bikes')
  @Protected('admin', 'body')
  @Required('body', 'bike')
  private async removeBike(req: Request, res: Response) {
    if (!this.setup) return;

    const body: AdminPayload = req.body;
    const bike = Number(body.bike!);

    if (!Cache.bikes.includes(bike))
      return res.json({ error: "Bike with that number doesn't exist" });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.bikes = ad.bikes.filter((x) => x !== bike);

    await this.admins.save(ad);

    Cache.removeBike(bike);

    return res.json({ message: 'Bike removed', bikes: ad.bikes });
  }

  @Post('bans')
  @Protected('admin', 'body')
  @Required('body', 'bike')
  private async updateBans(req: Request, res: Response) {
    if (!this.setup) return;

    const body: AdminPayload = req.body;
    const ban = body.ban!;

    if (Cache.bans.includes(ban))
      return res.json({ error: 'Ban with that number already exists' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.banlist.push(ban);

    await this.admins.save(ad);

    Cache.addBan(ban);

    return res.json({ message: 'Ban added', bans: ad.banlist });
  }

  @Delete('bans')
  @Protected('admin', 'body')
  @Required('body', 'ban')
  private async removeBan(req: Request, res: Response) {
    if (!this.setup) return;
    const body: AdminPayload = req.body;
    const ban = body.ban!;

    if (!Cache.bans.includes(ban))
      return res.json({ error: "Ban with that number doesn't exist" });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.banlist = ad.banlist.filter((x) => x !== ban);

    await this.admins.save(ad);

    Cache.removeBan(ban);

    return res.json({ message: 'Ban removed', bans: ad.banlist });
  }

  @Post('bikebans')
  @Protected('admin', 'body')
  @Required('body', 'bikeban')
  private async updateBikeBans(req: Request, res: Response) {
    if (!this.setup) return;

    const body: AdminPayload = req.body;
    const bikeban = body.bikeban!;

    if (Cache.bans.includes(bikeban))
      return res.json({ error: 'Bike ban with that number already exists' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.bikebans.push(bikeban);

    await this.admins.save(ad);

    Cache.addBikeBan(bikeban);

    return res.json({ message: 'Bike ban added', bikebans: ad.bikebans });
  }

  @Delete('bikebans')
  @Protected('admin', 'body')
  @Required('body', 'bikeban')
  private async removeBikeBan(req: Request, res: Response) {
    if (!this.setup) return;

    const body: AdminPayload = req.body;
    const bikeban = body.bikeban!;

    if (!Cache.bans.includes(bikeban))
      return res.json({ error: "Bike ban with that number doesn't exist" });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.bikebans = ad.bikebans.filter((x) => x !== bikeban);

    await this.admins.save(ad);

    Cache.removeBikeBan(bikeban);

    return res.json({ message: 'Ban added', bikebans: ad.bikebans });
  }
}

export type AdminPayload = {
  staff_name: string;
  student_id: string;
  superuser_key?: string;
  staff?: StaffMember;
  equipment?: Equipment;
  bike?: Bike;
  ban?: StaffMember;
  bikeban?: StaffMember;
};
