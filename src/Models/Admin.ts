import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Equipments, Staff, Bikes } from '../Util/Cache';

@Entity('admin')
export class Admin {
  @PrimaryColumn()
  public id!: number;

  @Column({ type: 'jsonb', array: false, default: () => "'[]'" })
  public equipment!: Equipments;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  public staff!: Staff;

  @Column('int', { array: true, default: () => 'ARRAY[]::integer[]' })
  public bikes!: Bikes;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  public banlist!: Staff;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  public bikebans!: Staff;
}
