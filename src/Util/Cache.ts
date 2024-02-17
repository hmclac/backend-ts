import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 0, checkperiod: 120 });

export class Cache {
  static setup() {
    cache.set('staff', []);
    cache.set('equipment', []);
    cache.set('bikes', []);
    cache.set('bans', []);
    cache.set('bikebans', []);
    cache.set('bikeupdate', '');
    cache.set('checkoutupdate', '');
    Cache.resetOccupancy();
  }

  static clear() {
    cache.close();
    Cache.setup();
  }
  static setStaff(value: Staff) {
    cache.set('staff', value);
  }

  static setEquipment(value: Equipments) {
    cache.set('equipment', value);
  }

  static setBikes(value: Bikes) {
    cache.set('bikes', value);
  }

  static setOccupancy(occtype: Rooms, value: OccupancyData) {
    cache.set(occtype, value);
  }

  static setBans(value: Staff) {
    cache.set('bans', value);
  }

  static setBikeBans(value: Staff) {
    cache.set('bikebans', value);
  }

  static setBikeUpdate(value: string) {
    cache.set('bikeupdate', value);
  }
  static setCheckoutUpdate(value: string) {
    cache.set('checkoutupdate', value);
  }

  static get bikeupdate() {
    return cache.get('bikeupdate')!;
  }
  static get checkoutupdate() {
    return cache.get('checkoutupdate')!;
  }

  static get staff(): Staff {
    return cache.get('staff')!;
  }

  static get equipment(): Equipments {
    return cache.get('equipment')!;
  }

  static get bikes(): Bikes {
    return cache.get('bikes')!;
  }
  static get bans(): Staff {
    return cache.get('bans')!;
  }
  static get bikebans(): Staff {
    return cache.get('bikebans')!;
  }

  static occupancy(occtype: Rooms): OccupancyData {
    return cache.get(occtype)!;
  }

  static addStaff(value: StaffMember) {
    cache.set('staff', [...(cache.get('staff') as Staff), value]);
  }

  static removeStaff(value: StaffMember) {
    cache.set(
      'staff',
      (cache.get('staff') as Staff).filter((x) => x !== value)
    );
  }

  static addEquipment(value: Equipment) {
    cache.set('equipment', [...(cache.get('equipment') as Equipments), value]);
  }

  static removeEquipment(value: Equipment) {
    cache.set(
      'equipment',
      (cache.get('equipment') as Equipments).filter((x) => x != value)
    );
  }

  static addBike(value: Bike) {
    cache.set('bikes', [...(cache.get('bikes') as Bikes), value]);
  }

  static removeBike(value: Bike) {
    cache.set(
      'bikes',
      (cache.get('bikes') as Bikes).filter((x) => x !== value)
    );
  }

  static addOccupancy(occtype: Rooms, value: Occ) {
    cache.set(occtype, [...(cache.get(occtype) as OccupancyData), value]);
  }

  static resetOccupancy() {
    cache.set('weight_room', []);
    cache.set('gym', []);
    cache.set('aerobics_room', []);
    cache.set('lobby', []);
  }

  static addBan(value: StaffMember) {
    cache.set('bans', [...(cache.get('bans') as Staff), value]);
  }

  static removeBan(value: StaffMember) {
    cache.set(
      'bans',
      (cache.get('bans') as Staff).filter((x) => x != value)
    );
  }

  static addBikeBan(value: StaffMember) {
    cache.set('bikebans', [...(cache.get('bikebans') as Staff), value]);
  }

  static removeBikeBan(value: StaffMember) {
    cache.set(
      'bikebans',
      (cache.get('bikebans') as Staff).filter((x) => x != value)
    );
  }
}

export type StaffMember = string;
export type Staff = StaffMember[];

export type Equipment = string;
export type Equipments = Equipment[];

export type Bike = number;
export type Bikes = Bike[];

export type Occ = { time: string; count: number };

export type OccupancyData = Occ[];

export type Rooms = 'weight_room' | 'gym' | 'aerobics_room' | 'lobby';
