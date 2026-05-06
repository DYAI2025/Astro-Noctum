import { randomUUID } from 'crypto';

const VALID_REQUEST_ID = /^req_[a-zA-Z0-9_-]{1,64}$/;

export function requestIdMiddleware(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const id = (incoming && VALID_REQUEST_ID.test(incoming))
    ? incoming
    : `req_${randomUUID()}`;
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
