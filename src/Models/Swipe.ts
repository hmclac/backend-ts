import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('swipe')
export class Swipe {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column()
  public staff_name: string;

  @Column()
  public student_id: string;

  @Column()
  public time_done: string;
}
