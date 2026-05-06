export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.strip().safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues ?? result.error.errors ?? [];
      const details = issues.map(e => ({
        path: `body.${e.path.join('.')}`,
        message: e.message,
      }));
      return res.status(422).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed.',
          request_id: req.requestId ?? null,
          recoverable: true,
          details,
        },
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.strip().safeParse(req.query);
    if (!result.success) {
      const issues = result.error.issues ?? result.error.errors ?? [];
      const details = issues.map(e => ({
        path: `query.${e.path.join('.')}`,
        message: e.message,
      }));
      return res.status(422).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed.',
          request_id: req.requestId ?? null,
          recoverable: true,
          details,
        },
      });
    }
    req.query = result.data;
    next();
  };
}
