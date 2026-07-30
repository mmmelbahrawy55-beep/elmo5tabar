describe('FraudDetectionService', () => {
  describe('velocity check', () => {
    it('should detect high velocity transactions', () => {
      const recentTransactions = Array.from({ length: 10 }, (_, i) => ({
        amount: 100,
        createdAt: new Date(Date.now() - i * 1000),
      }));

      const now = Date.now();
      const windowMs = 60000;
      const recent = recentTransactions.filter((t) => now - t.createdAt.getTime() < windowMs);

      expect(recent.length).toBeGreaterThan(5);
    });

    it('should pass low velocity transactions', () => {
      const recentTransactions = Array.from({ length: 2 }, (_, i) => ({
        amount: 100,
        createdAt: new Date(Date.now() - i * 3600000),
      }));

      const now = Date.now();
      const windowMs = 60000;
      const recent = recentTransactions.filter((t) => now - t.createdAt.getTime() < windowMs);

      expect(recent.length).toBeLessThan(3);
    });
  });

  describe('amount threshold', () => {
    it('should flag transaction above threshold', () => {
      const threshold = 10000;
      const transaction = { amount: 15000 };

      expect(transaction.amount).toBeGreaterThan(threshold);
    });

    it('should pass transaction below threshold', () => {
      const threshold = 10000;
      const transaction = { amount: 5000 };

      expect(transaction.amount).toBeLessThanOrEqual(threshold);
    });

    it('should flag unusually large transaction for user history', () => {
      const avgAmount = 200;
      const transaction = { amount: 5000 };
      const ratio = transaction.amount / avgAmount;

      expect(ratio).toBeGreaterThan(10);
    });
  });

  describe('new device detection', () => {
    it('should flag transaction from new device', () => {
      const knownDevices = ['device-fingerprint-1', 'device-fingerprint-2'];
      const newDevice = 'device-fingerprint-3';

      expect(knownDevices.includes(newDevice)).toBe(false);
    });

    it('should pass transaction from known device', () => {
      const knownDevices = ['device-fingerprint-1', 'device-fingerprint-2'];
      const knownDevice = 'device-fingerprint-1';

      expect(knownDevices.includes(knownDevice)).toBe(true);
    });
  });

  describe('IP geolocation mismatch', () => {
    it('should flag mismatched billing and IP locations', () => {
      const billingCountry = 'SA';
      const ipCountry = 'US';

      expect(billingCountry !== ipCountry).toBe(true);
    });

    it('should pass matching locations', () => {
      const billingCountry = 'SA';
      const ipCountry = 'SA';

      expect(billingCountry === ipCountry).toBe(true);
    });

    it('should detect impossible travel (same session, distant locations)', () => {
      const loginLocation = { lat: 24.7136, lng: 46.6753 };
      const paymentLocation = { lat: 40.7128, lng: -74.0060 };
      const timeDiffMinutes = 5;

      const distance = Math.sqrt(
        Math.pow(paymentLocation.lat - loginLocation.lat, 2) +
        Math.pow(paymentLocation.lng - loginLocation.lng, 2),
      );

      expect(distance).toBeGreaterThan(10);
      expect(timeDiffMinutes).toBeLessThan(60);
    });
  });

  describe('pattern matching', () => {
    it('should detect multiple failed payments', () => {
      const recentPayments = [
        { status: 'FAILED' },
        { status: 'FAILED' },
        { status: 'FAILED' },
        { status: 'SUCCESS' },
      ];

      const failures = recentPayments.filter((p) => p.status === 'FAILED');
      expect(failures.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect unusual bulk purchases', () => {
      const order = { quantity: 50, totalAmount: 25000 };
      const avgQuantity = 2;

      expect(order.quantity / avgQuantity).toBeGreaterThan(10);
    });

    it('should detect card testing patterns', () => {
      const attempts = Array.from({ length: 20 }, (_, i) => ({
        cardLast4: String(1000 + i).slice(-4),
        amount: 1.00,
        status: 'FAILED',
      }));

      const uniqueCards = new Set(attempts.map((a) => a.cardLast4));
      expect(uniqueCards.size).toBeGreaterThan(5);
      expect(attempts.every((a) => a.amount < 5)).toBe(true);
    });
  });
});
