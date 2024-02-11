import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('headcount')
export class Headcount {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column()
  public staff_name!: string;

  @Column()
  public weight_room: number;

  @Column()
  public weight_reserved!: boolean;

  @Column()
  public gym!: number;

  @Column()
  public gym_reserved!: boolean;

  @Column()
  public aerobics_room!: number;

  @Column()
  public aerobics_reserved!: boolean;

  @Column()
  public lobby!: number;

  @Column()
  public time_done!: string;
}
