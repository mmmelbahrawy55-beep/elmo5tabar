import { Test, TestingModule } from '@nestjs/testing';
import { DataEncryptionService } from './data-encryption.service';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { mockPrismaService } from '../../../test/mocks';

describe('DataEncryptionService', () => {
  let service: DataEncryptionService;
  let prisma: typeof mockPrismaService;

  beforeAll(async () => {
    process.env.DATA_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataEncryptionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get(DataEncryptionService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a string', () => {
      const plain = 'sensitive-data-123';
      const encrypted = service.encrypt(plain, 'RESTRICTED');
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.keyVersion).toBe(1);

      const decrypted = service.decrypt(encrypted.encrypted, encrypted.iv, encrypted.authTag, encrypted.keyVersion);
      expect(decrypted).toBe(plain);
    });

    it('should produce different ciphertext each time (random IV)', () => {
      const plain = 'same-data';
      const enc1 = service.encrypt(plain, 'RESTRICTED');
      const enc2 = service.encrypt(plain, 'RESTRICTED');
      expect(enc1.encrypted).not.toEqual(enc2.encrypted);
      expect(enc1.iv).not.toEqual(enc2.iv);
    });
  });

  describe('encryptField/decryptField', () => {
    it('should store encrypted field in Prisma vault', async () => {
      prisma.authDataVault.upsert.mockResolvedValue({ id: 'vault-1' });
      await service.encryptField('user-1', 'nationalId', '1234567890', 'RESTRICTED');
      expect(prisma.authDataVault.upsert).toHaveBeenCalled();
    });

    it('should decrypt field from Prisma vault', async () => {
      const plain = '1234567890';
      const encrypted = service.encrypt(plain, 'RESTRICTED');
      prisma.authDataVault.findUnique.mockResolvedValue({
        encryptedValue: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        keyVersion: encrypted.keyVersion,
      });
      const decrypted = await service.decryptField('user-1', 'nationalId');
      expect(decrypted).toBe(plain);
    });

    it('should return null for non-existent field', async () => {
      prisma.authDataVault.findUnique.mockResolvedValue(null);
      const result = await service.decryptField('user-1', 'nonExistent');
      expect(result).toBeNull();
    });
  });

  describe('key rotation', () => {
    it('should rotate keys and re-encrypt records', async () => {
      const plain = 'rotate-me';
      const enc = service.encrypt(plain, 'RESTRICTED');
      prisma.authDataVault.findMany.mockResolvedValue([
        { id: 'vault-1', encryptedValue: enc.encrypted, iv: enc.iv, authTag: enc.authTag, keyVersion: enc.keyVersion, classification: 'RESTRICTED' },
      ]);
      prisma.authDataVault.update.mockResolvedValue({ id: 'vault-1' });
      const result = await service.rotateKeys();
      expect(result.recordsUpdated).toBe(1);
      expect(result.newKeyVersion).toBe(enc.keyVersion + 1);
    });
  });

  describe('password and token utilities', () => {
    it('should hash and verify password', async () => {
      const password = 'StrongP@ss1';
      const hash = await service.hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      const valid = await service.verifyPassword(password, hash);
      expect(valid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const hash = await service.hashPassword('CorrectP@ss1');
      const valid = await service.verifyPassword('WrongP@ss1', hash);
      expect(valid).toBe(false);
    });

    it('should hash token with SHA-256', () => {
      const token = 'my-auth-token';
      const hashed = service.hashToken(token);
      expect(hashed).toHaveLength(64);
      expect(hashed).not.toBe(token);
    });

    it('should generate secure random bytes', () => {
      const buffer = service.generateSecureRandom(32);
      expect(buffer).toHaveLength(32);
    });

    it('should generate 6-digit OTP', () => {
      const otp = service.generateOTP();
      expect(otp).toHaveLength(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(0);
    });

    it('should generate base64url token', () => {
      const token = service.generateToken(32);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should compare strings in constant time', () => {
      expect(service.constantTimeCompare('abc', 'abc')).toBe(true);
      expect(service.constantTimeCompare('abc', 'xyz')).toBe(false);
      expect(service.constantTimeCompare('abc', 'abcd')).toBe(false);
    });
  });

  describe('key version', () => {
    it('should get current key version', () => {
      const version = service.getCurrentKeyVersion();
      expect(version).toBeGreaterThanOrEqual(1);
    });
  });
});
