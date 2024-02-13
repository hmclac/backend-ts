// import NodeCache from 'node-cache';

// const cache = new NodeCache({ stdTTL: 86400, checkperiod: 120 });

// class CacheUtils {
//   static setupCache() {
//     const initialCacheValues = {
//       staff: [],
//       equipment: [],
//       bikes: [],
//       bans: [],
//       bikebans: [],
//       bikeupdate: '',
//       checkoutupdate: '',
//       weight_room: [],
//       gym: [],
//       aerobics_room: [],
//       lobby: []
//     };

//     Object.entries(initialCacheValues).forEach(([key, value]) => {
//       cache.set(key, value);
//     });
//   }

//   static get<T>(key: string): T {
//     return cache.get(key) as T;
//   }

//   static set<T>(key: string, value: T) {
//     cache.set(key, value);
//   }

//   static updateArray<T>(key: string, updateFn: (current: T[]) => T[]) {
//     const currentValue = cache.get(key) as T[] | undefined;
//     if (currentValue) {
//       cache.set(key, updateFn(currentValue));
//     }
//   }
// }

// export class Cache {
//   static setup() {
//     CacheUtils.setupCache();
//   }

//   static clear() {
//     cache.flushAll();
//     Cache.setup();
//   }

//   // Simplify getters and setters
//   static get staff(): Staff {
//     return CacheUtils.get<Staff>('staff');
//   }

//   static set staff(value: Staff) {
//     CacheUtils.set('staff', value);
//   }

//   // Simplified method for adding/removing items
//   static addStaff(member: StaffMember) {
//     CacheUtils.updateArray('staff', (staff) => [...staff, member]);
//   }

//   static removeStaff(member: StaffMember) {
//     CacheUtils.updateArray('staff', (staff) =>
//       staff.filter((m) => m !== member)
//     );
//   }

//   // Apply similar simplifications to other properties as needed...

//   // Simplified occupancy management
//   static setOccupancy(occtype: Rooms, value: OccupancyData) {
//     CacheUtils.set(occtype, value);
//   }

//   static addOccupancy(occtype: Rooms, value: Occ) {
//     CacheUtils.updateArray(occtype, (data) => [...data, value]);
//   }

//   static resetOccupancy() {
//     ['weight_room', 'gym', 'aerobics_room', 'lobby'].forEach((room) => {
//       CacheUtils.set<Occ[]>(room, []);
//     });
//   }
// }
