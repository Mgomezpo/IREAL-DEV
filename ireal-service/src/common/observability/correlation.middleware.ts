import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';
const USER_ID_HEADER = 'x-user-id';

export const correlationMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const requestId =
    (req.headers[REQUEST_ID_HEADER] as string | undefined) ?? randomUUID();
  const userId =
    typeof req.headers[USER_ID_HEADER] === 'string'
      ? req.headers[USER_ID_HEADER]
      : Array.isArray(req.headers[USER_ID_HEADER])
        ? req.headers[USER_ID_HEADER]?.[0]
        : undefined;

  req.headers[REQUEST_ID_HEADER] = requestId;
  if (userId) {
    req.headers[USER_ID_HEADER] = userId;
  }

  (req as Request & { requestId?: string }).requestId = requestId;
  (req as Request & { userId?: string }).userId = userId;

  next();
};
