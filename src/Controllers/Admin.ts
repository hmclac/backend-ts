import { Controller, Get, Post, Delete } from '@overnightjs/core';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource, Repository } from 'typeorm';
import { Admin } from '../Models/Admin';
import { Bike, Cache, Equipment, StaffMember } from '../Util/Cache';
import { config } from '../config';

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
  private async getInfo(req: Request, res: Response) {
    console.log(req.query);
    if (!req.query || !req.query.staff_name) {
      return res.json({ error: 'No access' });
    }
    if (!Cache.staff.includes(req.query.staff_name as string)) {
      return res.json({ error: 'No access!' });
    }

    return res.json({
      bikes: Cache.bikes,
      staff: Cache.staff,
      equipment: Cache.equipment,
      bans: Cache.bans,
      bikebans: Cache.bikebans
    });
  }

  @Post('staff')
  private async updateStaff(req: Request, res: Response) {
    if (!this.setup) return;

    if (!req.body) return res.json({ error: 'No body' });
    const body: AdminPayload = req.body;
    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access' });
    // if (!body.superuser_key) return res.json({ error: 'No access' });

    // if (body.superuser_key !== config.superuser_key)
    //   return res.json({ error: 'No access!!' });

    if (!body.staff) return res.json({ error: 'Invalid body' });

    if (Cache.staff.includes(body.staff))
      return res.json({ error: 'Staff already added' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.staff.push(body.staff);

    await this.admins.save(ad);

    Cache.addStaff(body.staff);

    return res.json({ message: 'Staff member added', staff: ad.staff });
  }

  @Delete('staff')
  private async removeStaff(req: Request, res: Response) {
    if (!this.setup) return;

    if (!req.body) return res.json({ error: 'No body' });
    const body: AdminPayload = req.body;
    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access' });

    if (Cache.staff.length === 1) {
      return res.json({ error: "Can't delete last staff member" });
    }
    // if (!body.superuser_key) return res.json({ error: 'No access' });

    // if (body.superuser_key !== config.superuser_key)
    //   return res.json({ error: 'No access!!' });

    if (!body.staff) return res.json({ error: 'Invalid body' });

    if (!Cache.staff.includes(body.staff))
      return res.json({ error: 'Staff not added' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.staff = ad.staff.filter((x) => x !== body.staff);

    await this.admins.save(ad);

    Cache.removeStaff(body.staff);

    return res.json({ message: 'Staff member removed', staff: ad.staff });
  }

  @Post('equipment')
  private async updateEquipment(req: Request, res: Response) {
    if (!this.setup) return;

    if (!req.body) return res.json({ error: 'No body' });
    const body: AdminPayload = req.body;
    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    if (!body.equipment) return res.json({ error: 'Invalid body' });

    if (Cache.equipment.includes(body.equipment))
      return res.json({ error: 'Equipment with that name already exists' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.equipment.push(body.equipment);

    await this.admins.save(ad);

    Cache.addEquipment(body.equipment);

    return res.json({ message: 'Equipment added', equipment: ad.equipment });
  }

  @Delete('equipment')
  private async removeEquipment(req: Request, res: Response) {
    if (!this.setup) return;

    if (!req.body) return res.json({ error: 'No body' });
    const body: AdminPayload = req.body;
    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    if (!body.equipment) return res.json({ error: 'Invalid body' });

    if (!body.equipment) return res.json({ error: 'Invalid body' });

    if (!Cache.equipment.includes(body.equipment))
      return res.json({ error: 'No existing equipment with that name' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.equipment = ad.equipment.filter((x) => x !== body.equipment);

    await this.admins.save(ad);

    Cache.removeEquipment(body.equipment);

    return res.json({ message: 'Equipment removed', equipment: ad.equipment });
  }

  @Post('bikes')
  private async updateBikes(req: Request, res: Response) {
    if (!this.setup) return;

    if (!req.body) return res.json({ error: 'No body' });
    const body: AdminPayload = req.body;
    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    if (!body.bike) return res.json({ error: 'Invalid body' });
    body.bike = Number(body.bike);

    if (Cache.bikes.includes(body.bike))
      return res.json({ error: 'Bike with that number already exists' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.bikes.push(body.bike);

    await this.admins.save(ad);

    Cache.addBike(body.bike);

    return res.json({ message: 'Bike added', bikes: ad.bikes });
  }

  @Delete('bikes')
  private async removeBike(req: Request, res: Response) {
    if (!this.setup) return;

    if (!req.body) return res.json({ error: 'No body' });
    const body: AdminPayload = req.body;
    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    if (!body.bike) return res.json({ error: 'Invalid body' });
    body.bike = Number(body.bike);

    if (!Cache.bikes.includes(body.bike))
      return res.json({ error: "Bike with that number doesn't exist" });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.bikes = ad.bikes.filter((x) => x !== body.bike);

    await this.admins.save(ad);

    Cache.removeBike(body.bike);

    return res.json({ message: 'Bike removed', bikes: ad.bikes });
  }
  @Post('bans')
  private async updateBans(req: Request, res: Response) {
    if (!this.setup) return;

    if (!req.body) return res.json({ error: 'No body' });
    const body: AdminPayload = req.body;
    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    if (!body.ban) return res.json({ error: 'Invalid body' });

    if (Cache.bans.includes(body.ban))
      return res.json({ error: 'Ban with that number already exists' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.banlist.push(body.ban);

    await this.admins.save(ad);

    Cache.addBan(body.ban);

    return res.json({ message: 'Ban added', bans: ad.banlist });
  }

  @Delete('bans')
  private async removeBan(req: Request, res: Response) {
    if (!this.setup) return;

    if (!req.body) return res.json({ error: 'No body' });
    const body: AdminPayload = req.body;
    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    if (!body.ban) return res.json({ error: 'Invalid body' });

    if (!Cache.bans.includes(body.ban))
      return res.json({ error: "Ban with that number doesn't exist" });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.banlist = ad.banlist.filter((x) => x !== body.ban);

    await this.admins.save(ad);

    Cache.removeBan(body.ban);

    return res.json({ message: 'Ban removed', bans: ad.banlist });
  }

  @Post('bikebans')
  private async updateBikeBans(req: Request, res: Response) {
    if (!this.setup) return;

    if (!req.body) return res.json({ error: 'No body' });
    const body: AdminPayload = req.body;
    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    if (!body.bikeban) return res.json({ error: 'Invalid body' });

    if (Cache.bans.includes(body.bikeban))
      return res.json({ error: 'Bike ban with that number already exists' });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.bikebans.push(body.bikeban);

    await this.admins.save(ad);

    Cache.addBikeBan(body.bikeban);

    return res.json({ message: 'Bike ban added', bikebans: ad.bikebans });
  }
  @Delete('bikebans')
  private async removeBikeBan(req: Request, res: Response) {
    if (!this.setup) return;

    if (!req.body) return res.json({ error: 'No body' });
    const body: AdminPayload = req.body;
    if (!Cache.staff.includes(body.staff_name))
      return res.json({ error: 'No access!' });

    if (!body.bikeban) return res.json({ error: 'Invalid body' });

    if (!Cache.bans.includes(body.bikeban))
      return res.json({ error: "Bike ban with that number doesn't exist" });

    const ad = await this.admins.findOneBy({ id: 1 });
    if (!ad) throw new Error('oops');

    ad.bikebans = ad.bikebans.filter((x) => x !== body.bikeban);

    await this.admins.save(ad);

    Cache.removeBikeBan(body.bikeban);

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
