import { Request, Response, NextFunction } from 'express';
import { Cache } from './Cache';

const checkRole = (
  req: Request,
  role: 'staff' | 'admin',
  method: 'body' | 'query'
): boolean => {
  // Example: Validate role from req (e.g., JWT token, session)
  if (method === 'body')
    return req.body && Cache.staff.includes(req.body.staff_name);
  if (method === 'query')
    return req.query && Cache.staff.includes(req.query.staff_name as string);
  else return false;
};

// Protected decorator factory
export const Protected =
  (role: 'staff' | 'admin', method: 'body' | 'query') =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const req: Request = args[0];
      const res: Response = args[1];
      const next: NextFunction = args[2];

      if (!checkRole(req, role, method)) {
        res.status(403).json({ error: 'Unauthorized access' });
        return;
      }

      // Proceed with the original method
      originalMethod.apply(this, args);
    };
  };

// Required decorator factory
export const Required =
  (method: 'body' | 'query', ...requiredFields: string[]) =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const req: Request = args[0];
      const res: Response = args[1];
      let missingFields: string[] = [];

      // Check for required fields
      if (method === 'body') {
        missingFields = requiredFields.filter(
          (field) =>
            !(field in req.body) ||
            req.body[field] === undefined ||
            req.body[field] === ''
        );
      } else if (method === 'query') {
        missingFields = requiredFields.filter(
          (field) =>
            !(field in req.query) ||
            req.query[field] === undefined ||
            req.query[field] === ''
        );
      }

      // If there are missing fields, respond with an error
      if (missingFields.length) {
        res.status(400).json({
          error: `Missing required or invalid ${method} fields: ${missingFields.join(
            ', '
          )}`
        });
        return;
      }

      // Proceed with the original method if all required fields are present
      originalMethod.apply(this, args);
    };
  };
