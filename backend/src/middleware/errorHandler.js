export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let statusCode = error.statusCode || 500;
  let message = statusCode === 500 ? 'Something went wrong. Please try again.' : error.message;
  let errors = error.details?.errors;

  if (error.code === 11000) {
    statusCode = 409;
    message = 'A record with the submitted unique value already exists.';
  }
  if (error.name === 'MulterError') {
    statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'Images must be 5 MB or smaller.' : 'The uploaded file could not be accepted.';
  }
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Please check the submitted information.';
    errors = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
  }

  if (statusCode === 500) console.error(error);
  res.status(statusCode).json({ message, ...(errors ? { errors } : {}) });
}
