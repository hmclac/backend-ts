import { Controller, Get, Post, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import { BikeNotes } from '../Models';
import { Cache } from '../Util/Cache';
import { Protected, Required } from '../Util/Middleware';

@Controller('bikenotes')
export class BikeNotesController {
  private bikeNotes: Repository<BikeNotes>;

  constructor(dataSource: DataSource) {
    this.bikeNotes = dataSource.getRepository(BikeNotes);
  }

  @Get('/')
  @Protected('staff', 'query')
  private async getBikeNotes(req: Request, res: Response) {
    const oneOfEachBike = await this.bikeNotes
      .createQueryBuilder('bikenotes')
      .where('bikenotes.current = :current', { current: true })
      .getMany();

    return res.json(oneOfEachBike);
  }

  @Post('/')
  @Protected('staff', 'body')
  @Required('body', 'bike_number', 'notes')
  private async createBikeNotes(req: Request, res: Response) {
    const body: BikeNotesBody = req.body;

    const { staff_name, bike_number: bn, notes } = body;
    const bike_number = Number(bn);

    if (!Cache.bikes.includes(bike_number))
      return res.json({ error: 'Invalid bike number' });
    const mostRecent = await this.bikeNotes.findOneBy({
      current: true,
      bike_number
    });

    if (mostRecent) {
      mostRecent.current = false;
      await this.bikeNotes.save(mostRecent);
    }
    const newNote = this.bikeNotes.create({
      bike_number,
      staff_name,
      notes
    });
    await this.bikeNotes.save(newNote);

    return res.json(newNote);
  }
}

type BikeNotesBody = {
  notes: string;
  staff_name: string;
  bike_number: string;
};
