import { ApiError, errorCodes } from '../errors/apiErrors.mjs';

export function errorHandler(err, req, res, _next) {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : (err.status ?? 500);
  const code = isApiError ? err.code : 'INTERNAL_ERROR';
  const message = isApiError ? err.message : errorCodes.INTERNAL_ERROR.message;
  const recoverable = isApiError ? err.recoverable : false;

  if (!isApiError) {
    console.error('[server] unhandled error', {
      requestId: req.requestId ?? null,
      message: err.message,
      stack: err.stack,
    });
  }

  const body = {
    error: {
      code,
      message,
      request_id: req.requestId ?? null,
      recoverable,
      retry_after: isApiError ? (err.retryAfter ?? null) : null,
    },
  };
  if (isApiError && err.details) {
    body.error.details = err.details;
  }

  res.status(status).json(body);
}
