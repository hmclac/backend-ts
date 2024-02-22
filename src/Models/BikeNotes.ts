import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('bikenotes')
export class BikeNotes {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column()
  public bike_number: number;

  @Column()
  public staff_name!: string;

  @Column()
  public notes: string = '';

  @Column()
  public current: boolean = true;

  @Column()
  public time: string = String(Date.now());
}
