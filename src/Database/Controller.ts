import { DataSource, Repository, ObjectLiteral, EntityTarget } from 'typeorm';
import { TypeORMModels } from '../Interfaces';
import { Bike, Swipe, Headcount, Checkout, Admin } from '../Models';
import 'reflect-metadata';
import { logger } from '../';
import { config } from '../config';

// DataSource configuration

const { host, username, password, database } = config;

const AppDataSource = new DataSource({
  type: 'postgres',
  host,
  port: 5432,
  username,
  password,
  database,
  synchronize: true,
  logging: true,
  entities: [Bike, Swipe, Headcount, Checkout, Admin], // Include your entities here
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
      admin: this.dataSource.getRepository(Admin)
    };
    Object.freeze(this.models); // Freezing the models object
  }

  public async createConnection() {
    try {
      await this.dataSource.initialize();
    } catch (e) {
      logger.err(e);
      process.exit(1);
    }

    // Synchronization is handled via the `synchronize` option in the DataSource config.
  }

  // public getModel<T extends ObjectLiteral>(model: string): Repository<T> {
  //   if (!this.dataSource.isInitialized) {
  //     throw new Error('The DataSource is not initialized yet!');
  //   }
  //   const repository = this.models[model];
  //   if (!repository) {
  //     throw new Error(`Repository for model ${model} not found`);
  //   }
  //   return repository as Repository<T>;
  // }
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

// Usage example
// const typeORMController = new TypeORMController();
// await typeORMController.createConnection();
// const userRepo = typeORMController.getModel<UserAuthData>('userAuthData');
