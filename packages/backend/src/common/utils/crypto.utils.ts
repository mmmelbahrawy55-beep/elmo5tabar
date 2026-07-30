import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateRandomToken(length = 40): string {
  return randomBytes(length).toString('hex');
}

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export function generateApiKey(): string {
  return `${uuidv4()}-${randomBytes(32).toString('hex')}`;
}
