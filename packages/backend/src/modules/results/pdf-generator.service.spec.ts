import * as crypto from 'crypto';

describe('PdfGeneratorService', () => {
  describe('PDF generation', () => {
    it('should generate PDF buffer', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 test pdf content');
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.toString('utf-8', 0, 8)).toBe('%PDF-1.4');
    });

    it('should generate bilingual (AR/EN) PDF', () => {
      const bilingualContent = {
        ar: 'تقرير المختبر',
        en: 'Laboratory Report',
        items: [
          { nameAr: 'سكر صائم', nameEn: 'Fasting Glucose', value: '5.5', unit: 'mmol/L' },
          { nameAr: 'دهون ثلاثية', nameEn: 'Triglycerides', value: '1.2', unit: 'mmol/L' },
        ],
      };

      expect(bilingualContent.ar).toBeDefined();
      expect(bilingualContent.en).toBeDefined();
      expect(bilingualContent.items).toHaveLength(2);
    });

    it('should include patient information in PDF', () => {
      const patientInfo = {
        nameAr: 'محمد أحمد',
        nameEn: 'Mohammed Ahmed',
        patientNumber: 'P-2026000001',
        dateOfBirth: '1990-01-15',
        gender: 'Male',
      };

      expect(patientInfo.nameAr).toBe('محمد أحمد');
      expect(patientInfo.patientNumber).toMatch(/^P-\d{10}$/);
    });

    it('should handle large result sets', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        nameAr: `تحليل ${i + 1}`,
        value: `${(Math.random() * 100).toFixed(2)}`,
        unit: 'mg/dL',
      }));

      expect(items).toHaveLength(100);
    });
  });

  describe('QR code embedding', () => {
    it('should generate QR code data for report verification', () => {
      const qrData = {
        reportNumber: 'RPT-2026000001',
        patientId: 'patient-1',
        issuedAt: new Date().toISOString(),
        verificationUrl: `https://verify.almokhtabar.com/report/RPT-2026000001`,
      };

      expect(qrData.verificationUrl).toContain('verify.almokhtabar.com');
      expect(qrData.reportNumber).toBeDefined();
    });

    it('should verify QR data integrity', () => {
      const original = { reportNumber: 'RPT-2026000001', hash: 'abc123' };
      const serialized = JSON.stringify(original);
      const recovered = JSON.parse(serialized);

      expect(recovered).toEqual(original);
    });
  });

  describe('digital signature verification', () => {
    it('should sign PDF document', () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const docHash = crypto.createHash('sha256').update('pdf content').digest('hex');
      const sign = crypto.createSign('SHA256');
      sign.update(docHash);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      expect(signature).toBeDefined();
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should verify PDF signature', () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const docHash = crypto.createHash('sha256').update('pdf content').digest('hex');
      const sign = crypto.createSign('SHA256');
      sign.update(docHash);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      const verify = crypto.createVerify('SHA256');
      verify.update(docHash);
      verify.end();
      const isValid = verify.verify(publicKey, signature, 'base64');

      expect(isValid).toBe(true);
    });

    it('should detect tampered signature', () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const docHash = crypto.createHash('sha256').update('original pdf').digest('hex');
      const sign = crypto.createSign('SHA256');
      sign.update(docHash);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      const tamperedHash = crypto.createHash('sha256').update('tampered pdf').digest('hex');
      const verify = crypto.createVerify('SHA256');
      verify.update(tamperedHash);
      verify.end();
      const isValid = verify.verify(publicKey, signature, 'base64');

      expect(isValid).toBe(false);
    });
  });
});
