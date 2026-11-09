import { AppError } from '../utils/AppError.js';

export function validate(schema) {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError('Please check the submitted information.', 400, { errors }));
    }

    if (result.data.query) req.validatedQuery = result.data.query;
    if (result.data.params) Object.assign(req.params, result.data.params);
    next();
  };
}
