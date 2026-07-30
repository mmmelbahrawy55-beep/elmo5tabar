export const BASE_URL = __ENV.BASE_URL || 'https://almokhtabar.com';
export const API_URL = `${BASE_URL}/api/v1`;
export const STAGES = {
  smoke: [{ duration: '1m', target: 5 }],
  soak: [
    { duration: '10m', target: 100 },
    { duration: '30m', target: 100 },
    { duration: '10m', target: 0 },
  ],
  stress: [
    { duration: '5m', target: 200 },
    { duration: '10m', target: 500 },
    { duration: '5m', target: 1000 },
    { duration: '5m', target: 0 },
  ],
  spike: [
    { duration: '2m', target: 50 },
    { duration: '1m', target: 2000 },
    { duration: '5m', target: 2000 },
    { duration: '3m', target: 0 },
  ],
  endurance: [
    { duration: '2h', target: 200 },
    { duration: '1h', target: 200 },
  ],
};

export const THRESHOLDS = {
  http_req_duration: ['p(95)<500', 'p(99)<1000', 'max<3000'],
  http_req_failed: ['rate<0.01'],
  iterations: ['count>1000'],
};

export const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'Accept-Language': 'ar-SA',
};
