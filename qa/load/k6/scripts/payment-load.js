import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.1/index.js';
import { BASE_URL, API_URL, STAGES, THRESHOLDS, AUTH_HEADERS } from '../config.js';

export const options = {
  stages: [
    { duration: '3m', target: 50 },
    { duration: '10m', target: 200 },
    { duration: '5m', target: 500 },
    { duration: '3m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'max<5000'],
    http_req_failed: ['rate<0.02'],
    payment_stripe_duration: ['p(95)<3000'],
    payment_tap_duration: ['p(95)<3000'],
    payment_hyperpay_duration: ['p(95)<3000'],
    payment_paypal_duration: ['p(95)<3000'],
    invoice_create_duration: ['p(95)<1500'],
    refund_duration: ['p(95)<3000'],
    wallet_duration: ['p(95)<1000'],
    stripe_errors: ['rate<0.02'],
    tap_errors: ['rate<0.02'],
  },
  tags: { service: 'payments', environment: __ENV.ENV || 'staging' },
};

const stripeDuration = new Trend('payment_stripe_duration', true);
const tapDuration = new Trend('payment_tap_duration', true);
const hyperpayDuration = new Trend('payment_hyperpay_duration', true);
const paypalDuration = new Trend('payment_paypal_duration', true);
const invoiceCreateDuration = new Trend('invoice_create_duration', true);
const refundDuration = new Trend('refund_duration', true);
const walletDuration = new Trend('wallet_duration', true);
const stripeErrors = new Rate('stripe_errors');
const tapErrors = new Rate('tap_errors');
const hyperpayErrors = new Rate('hyperpay_errors');
const paypalErrors = new Rate('paypal_errors');
const refundErrors = new Rate('refund_errors');

const CURRENCIES = ['SAR', 'AED', 'USD'];
const PAYMENT_METHODS = ['mada', 'visa', 'mastercard', 'apple_pay', 'stc_pay'];

function getHeaders() {
  return {
    ...AUTH_HEADERS,
    Authorization: `Bearer ${__ENV.AUTH_TOKEN || ''}`,
    'X-Idempotency-Key': `pmt-${randomString(32)}`,
  };
}

function generateInvoiceId() {
  return `INV-${Date.now()}-${randomString(8).toUpperCase()}`;
}

function generateAmount() {
  const amounts = [49, 99, 149, 199, 249, 299, 349, 399, 449, 499, 599, 699, 799, 899, 999, 1299, 1499];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

export function setup() {
  const health = http.get(`${API_URL}/health`, { headers: AUTH_HEADERS });
  check(health, { 'payment service reachable': (r) => r.status === 200 });
  return {};
}

export default function () {
  const rand = Math.random();
  const invoiceId = generateInvoiceId();
  const amount = generateAmount();

  group('Payment Processing Flow', function () {
    if (rand < 0.2) {
      group('Create Invoice', function () {
        const payload = JSON.stringify({
          appointmentId: `APT-${randomString(12)}`,
          patientId: `PAT-${randomString(10)}`,
          items: [
            {
              code: `LAB-${randomString(6)}`,
              name: 'Complete Blood Count',
              category: 'lab_test',
              quantity: 1,
              unitPrice: amount,
              vatRate: 15,
            },
          ],
          currency: CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)],
          discount: Math.random() > 0.8 ? randomIntBetween(10, 50) : 0,
          insuranceClaimId: Math.random() > 0.7 ? `CLM-${randomString(10)}` : undefined,
          notes: Math.random() > 0.8 ? `Invoice for appointment` : undefined,
        });

        const res = http.post(`${API_URL}/payments/invoices`, payload, {
          headers: getHeaders(),
          tags: { action: 'create_invoice' },
        });

        invoiceCreateDuration.add(res.timings.duration);

        check(res, {
          'create invoice status is 201': (r) => r.status === 201,
          'create invoice has invoice id': (r) => r.json('invoice.id') !== undefined || r.json('id') !== undefined,
          'create invoice has amount': (r) => r.json('invoice.amount') !== undefined || r.json('amount') !== undefined,
          'create invoice response time < 1500ms': (r) => r.timings.duration < 1500,
        });
      });
    } else if (rand < 0.4) {
      group('Process Payment Stripe', function () {
        const payload = JSON.stringify({
          invoiceId: invoiceId,
          amount: amount,
          currency: 'SAR',
          paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
          source: 'web',
          saveCard: Math.random() > 0.5,
          description: 'Laboratory test payment',
          metadata: {
            patientId: `PAT-${randomString(10)}`,
            appointmentId: `APT-${randomString(12)}`,
            branchId: `BR-${String(randomIntBetween(1, 50)).padStart(4, '0')}`,
          },
        });

        const res = http.post(`${API_URL}/payments/stripe/charge`, payload, {
          headers: getHeaders(),
          tags: { action: 'stripe_payment' },
        });

        stripeDuration.add(res.timings.duration);
        stripeErrors.add(res.status !== 200 && res.status !== 201);

        check(res, {
          'stripe payment status is 200 or 201': (r) => r.status === 200 || r.status === 201,
          'stripe payment has transaction id': (r) => r.json('transactionId') !== undefined || r.json('id') !== undefined,
          'stripe payment response time < 3s': (r) => r.timings.duration < 3000,
        });
      });
    } else if (rand < 0.55) {
      group('Process Payment Tap', function () {
        const payload = JSON.stringify({
          invoiceId: invoiceId,
          amount: amount,
          currency: 'SAR',
          customer: {
            firstName: 'Ahmed',
            lastName: 'Al-Saud',
            email: `patient.${randomString(8)}@example.com`,
            phone: `9665${Math.random().toString().slice(2, 11)}`,
          },
          source: 'src_sa.mada',
          redirectUrl: `${BASE_URL}/payment/callback`,
          postUrl: `${API_URL}/payments/tap/webhook`,
          metadata: { orderId: invoiceId },
        });

        const res = http.post(`${API_URL}/payments/tap/charge`, payload, {
          headers: getHeaders(),
          tags: { action: 'tap_payment' },
        });

        tapDuration.add(res.timings.duration);
        tapErrors.add(res.status !== 200 && res.status !== 201);

        check(res, {
          'tap payment status is 200 or 201': (r) => r.status === 200 || r.status === 201,
          'tap payment has transaction id': (r) => r.json('transactionId') !== undefined,
          'tap payment has redirect url': (r) => r.json('redirectUrl') !== undefined,
          'tap payment response time < 3s': (r) => r.timings.duration < 3000,
        });
      });
    } else if (rand < 0.7) {
      group('Process Payment HyperPay', function () {
        const payload = JSON.stringify({
          invoiceId: invoiceId,
          amount: amount,
          currency: 'SAR',
          paymentBrand: 'VISA',
          paymentType: 'DB',
          card: {
            number: '4000000000000002',
            expiryMonth: '12',
            expiryYear: '2028',
            cvv: '123',
          },
          customer: {
            givenName: 'Test',
            surname: 'Patient',
            email: `patient.${randomString(8)}@example.com`,
          },
          billing: {
            street: 'King Fahd Road',
            city: 'Riyadh',
            state: 'Riyadh',
            country: 'SA',
            postalCode: '12345',
          },
        });

        const res = http.post(`${API_URL}/payments/hyperpay/charge`, payload, {
          headers: getHeaders(),
          tags: { action: 'hyperpay_payment' },
        });

        hyperpayDuration.add(res.timings.duration);
        hyperpayErrors.add(res.status !== 200 && res.status !== 201);

        check(res, {
          'hyperpay payment status is 200 or 201': (r) => r.status === 200 || r.status === 201,
          'hyperpay payment has transaction id': (r) => r.json('transactionId') !== undefined,
          'hyperpay payment response time < 3s': (r) => r.timings.duration < 3000,
        });
      });
    } else if (rand < 0.8) {
      group('Process Payment PayPal', function () {
        const payload = JSON.stringify({
          invoiceId: invoiceId,
          amount: amount,
          currency: 'USD',
          intent: 'sale',
          redirectUrls: {
            returnUrl: `${BASE_URL}/payment/success`,
            cancelUrl: `${BASE_URL}/payment/cancel`,
          },
          payer: {
            paymentMethod: 'paypal',
            payerInfo: {
              email: `payer.${randomString(8)}@example.com`,
              firstName: 'Ahmed',
              lastName: 'Test',
            },
          },
          transactions: [
            {
              description: 'Laboratory services',
              custom: invoiceId,
              invoiceNumber: invoiceId,
              itemList: {
                items: [
                  {
                    name: 'Lab Test Package',
                    quantity: 1,
                    price: amount.toString(),
                    currency: 'USD',
                  },
                ],
              },
            },
          ],
        });

        const res = http.post(`${API_URL}/payments/paypal/create`, payload, {
          headers: getHeaders(),
          tags: { action: 'paypal_payment' },
        });

        paypalDuration.add(res.timings.duration);
        paypalErrors.add(res.status !== 200 && res.status !== 201);

        check(res, {
          'paypal payment status is 200 or 201': (r) => r.status === 200 || r.status === 201,
          'paypal payment has approval url': (r) => r.json('approvalUrl') !== undefined || r.json('links') !== undefined,
          'paypal payment response time < 3s': (r) => r.timings.duration < 3000,
        });
      });
    } else if (rand < 0.9) {
      group('Refund', function () {
        const payload = JSON.stringify({
          transactionId: `TXN-${randomString(20)}`,
          amount: Math.floor(amount / 2),
          currency: 'SAR',
          reason: 'Patient cancellation',
          initiatedBy: 'system',
          metadata: {
            invoiceId: invoiceId,
            appointmentId: `APT-${randomString(12)}`,
          },
        });

        const res = http.post(`${API_URL}/payments/refund`, payload, {
          headers: getHeaders(),
          tags: { action: 'refund' },
        });

        refundDuration.add(res.timings.duration);
        refundErrors.add(res.status !== 200 && res.status !== 201);

        check(res, {
          'refund status is 200 or 201 or 404': (r) => r.status === 200 || r.status === 201 || r.status === 404,
          'refund response time < 3s': (r) => r.timings.duration < 3000,
        });
      });
    } else {
      group('Wallet Operations', function () {
        const walletAction = Math.random();
        const patientId = `PAT-${randomString(10)}`;

        if (walletAction < 0.5) {
          const res = http.get(`${API_URL}/payments/wallet/${patientId}/balance`, {
            headers: getHeaders(),
            tags: { action: 'wallet_balance' },
          });

          walletDuration.add(res.timings.duration);

          check(res, {
            'wallet balance status is 200': (r) => r.status === 200,
            'wallet balance response time < 1s': (r) => r.timings.duration < 1000,
          });
        } else {
          const payload = JSON.stringify({
            patientId: patientId,
            amount: randomIntBetween(100, 1000),
            currency: 'SAR',
            operation: 'credit',
            description: 'Wallet top-up',
            paymentMethod: 'mada',
          });

          const res = http.post(`${API_URL}/payments/wallet/topup`, payload, {
            headers: getHeaders(),
            tags: { action: 'wallet_topup' },
          });

          walletDuration.add(res.timings.duration);

          check(res, {
            'wallet topup status is 200 or 201': (r) => r.status === 200 || r.status === 201,
            'wallet topup response time < 1s': (r) => r.timings.duration < 1000,
          });
        }
      });
    }
  });

  sleep(randomIntBetween(1, 2));
}
