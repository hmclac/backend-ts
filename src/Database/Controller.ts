import { DataSource, Repository, ObjectLiteral, EntityTarget } from 'typeorm';
import { Bike, Swipe, Headcount, Checkout, Admin, BikeNotes } from '../Models';
import 'reflect-metadata';
import { logger } from '../';
import { config } from '../config';

const { host, username, password, database } = config;

interface TypeORMModels {
  [key: string]: Repository<any>;
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host,
  port: 5432,
  username,
  password,
  database,
  synchronize: true,
  logging: true,
  entities: [Bike, Swipe, Headcount, Checkout, Admin, BikeNotes], // Include your entities here
  subscribers: [],
  migrations: []
});

export class TypeORMController {
  private dataSource: DataSource;

  public models: TypeORMModels;

  constructor() {
    this.dataSource = AppDataSource;
    this.models = {
      bike: this.dataSource.getRepository(Bike),
      checkout: this.dataSource.getRepository(Checkout),
      headcount: this.dataSource.getRepository(Headcount),
      swipe: this.dataSource.getRepository(Swipe),
      admin: this.dataSource.getRepository(Admin),
      bikeNotes: this.dataSource.getRepository(BikeNotes)
    };
    Object.freeze(this.models);
  }

  public async createConnection() {
    try {
      await this.dataSource.initialize();
    } catch (e) {
      logger.err(e);
      process.exit(1);
    }
  }

  public getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>
  ): Repository<T> {
    if (!this.dataSource.isInitialized) {
      throw new Error('DataSource not initialized');
    }

    return this.dataSource.getRepository(entity);
  }

  public get connection() {
    return this.dataSource;
  }
}
