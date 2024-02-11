import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('checkout')
export class Checkout {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column()
  public rented_staff: string;

  @Column({ nullable: true })
  public returned_staff?: string;

  @Column()
  public equipment_type: string;

  @Column()
  public time_checked_out: string;

  @Column({ nullable: true })
  public time_checked_in?: string;

  @Column()
  public student_id: string;

  @Column({ nullable: true })
  public email?: string;

  @Column()
  public student_name: string;
}
