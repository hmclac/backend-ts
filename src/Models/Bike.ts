import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('bike')
export class Bike {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column()
  public rented_staff!: string;

  @Column({ nullable: true })
  public returned_staff?: string;

  @Column()
  public bike_number: number;

  @Column()
  public time_checked_out!: string;

  @Column({ nullable: true })
  public time_checked_in?: string;

  @Column()
  public date_due!: string;

  @Column()
  public student_id!: string;

  @Column()
  public email!: string;

  @Column()
  public student_name!: string;

  @Column()
  public rented: boolean = true;

  @Column()
  public renews!: number;
}
