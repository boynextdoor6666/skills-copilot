import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const incoming = req.headers['x-request-id'];
    const id = (typeof incoming === 'string' && incoming.trim()) ? incoming.trim() : randomUUID();
    req.id = id;
    res.setHeader('x-request-id', id);
    next();
  }
}
