import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(request, _response, next) {
  next(new ApiError(404, `Route not found: ${request.method} ${request.originalUrl}`));
}

export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  if (statusCode === 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    error: {
      message,
      ...(error.details ? { details: error.details } : {}),
    },
  });
}
