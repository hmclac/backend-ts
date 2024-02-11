import { Repository } from 'typeorm';
import { Bike, Swipe, Headcount, Checkout } from '../Models';

export interface TypeORMModels {
  [key: string]: Repository<any>;
}
