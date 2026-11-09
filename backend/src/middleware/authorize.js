import { AppError } from '../utils/AppError.js';

export function authorize(...allowedRoles) {
  return function authorizeRole(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource.', 403));
    }
    next();
  };
}
