import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class DigitalSignatureService {
  private readonly logger = new Logger(DigitalSignatureService.name);
  private readonly algorithm = 'sha256';
  private readonly signatureEncoding: BufferEncoding & string = 'base64';
  private privateKey: string;
  private publicKey: string;

  constructor(config: ConfigService) {
    this.privateKey = config.get<string>('SIGNATURE_PRIVATE_KEY', '');
    this.publicKey = config.get<string>('SIGNATURE_PUBLIC_KEY', '');
    if (!this.privateKey || !this.publicKey) {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
      });
      this.privateKey = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
      this.publicKey = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString();
      this.logger.warn('Generated ephemeral RSA key pair. Set SIGNATURE_PRIVATE_KEY and SIGNATURE_PUBLIC_KEY in env for persistence.');
    }
  }

  async sign(data: string | Buffer): Promise<{ signature: string; algorithm: string; timestamp: Date }> {
    const sign = crypto.createSign(this.algorithm);
    sign.update(typeof data === 'string' ? data : data.toString('hex'));
    sign.end();
    const signature = sign.sign(this.privateKey, 'base64');
    return { signature, algorithm: 'SHA-256/RSA', timestamp: new Date() };
  }

  async verify(data: string | Buffer, signature: string): Promise<boolean> {
    try {
      const verify = crypto.createVerify(this.algorithm);
      verify.update(typeof data === 'string' ? data : data.toString('hex'));
      verify.end();
      return verify.verify(this.publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error('Signature verification failed', error);
      return false;
    }
  }

  async signReport(reportId: string, reportData: string): Promise<{ signature: string; algorithm: string }> {
    const result = await this.sign(reportData + reportId);
    return { signature: result.signature, algorithm: result.algorithm };
  }

  async verifyReport(reportId: string, reportData: string, signature: string): Promise<boolean> {
    return this.verify(reportData + reportId, signature);
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  generateKeyPair(): { privateKey: string; publicKey: string } {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
    });
    return {
      privateKey: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
      publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    };
  }

  hashDocument(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

