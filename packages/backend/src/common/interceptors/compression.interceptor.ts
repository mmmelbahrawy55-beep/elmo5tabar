import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as zlib from 'zlib';
import { promisify } from 'util';

const brotliCompress = promisify(zlib.brotliCompress);
const gzipCompress = promisify(zlib.gzip);
const deflateCompress = promisify(zlib.deflate);

@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();
    const acceptEncoding = request.headers['accept-encoding'] || '';

    return next.handle().pipe(
      map(async (data) => {
        const body = JSON.stringify(data);
        if (body.length < 1024) return data;

        let compressed: Buffer;
        let encoding: string;

        if (acceptEncoding.includes('br')) {
          compressed = await brotliCompress(body, {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 },
          });
          encoding = 'br';
        } else if (acceptEncoding.includes('gzip')) {
          compressed = await gzipCompress(body, { level: 6 });
          encoding = 'gzip';
        } else if (acceptEncoding.includes('deflate')) {
          compressed = await deflateCompress(body, { level: 6 });
          encoding = 'deflate';
        } else {
          return data;
        }

        response.setHeader('Content-Encoding', encoding);
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Transfer-Encoding', 'chunked');
        response.setHeader('Vary', 'Accept-Encoding');
        return compressed;
      }),
    );
  }
}
