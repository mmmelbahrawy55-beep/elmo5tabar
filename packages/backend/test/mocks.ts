import { Provider } from '@nestjs/common';

export const mockStripeService: Provider = {
  provide: 'STRIPE_SERVICE',
  useValue: {
    createPaymentIntent: jest.fn().mockResolvedValue({ id: 'pi_test', clientSecret: 'cs_test' }),
    confirmPayment: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
    createRefund: jest.fn().mockResolvedValue({ id: 're_test', status: 'succeeded' }),
    createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test' }),
    processPayment: jest.fn().mockResolvedValue({ success: true, transactionId: 'txn_test' }),
  },
};

export const mockTapService: Provider = {
  provide: 'TAP_SERVICE',
  useValue: {
    createCharge: jest.fn().mockResolvedValue({ id: 'tap_test', status: 'CAPTURED' }),
    getCharge: jest.fn().mockResolvedValue({ id: 'tap_test', status: 'CAPTURED' }),
    createRefund: jest.fn().mockResolvedValue({ id: 'ref_tap', status: 'REFUNDED' }),
  },
};

export const mockHyperPayService: Provider = {
  provide: 'HYPERPAY_SERVICE',
  useValue: {
    createCheckout: jest.fn().mockResolvedValue({ id: 'hp_test', url: 'https://checkout.hyperpay.com/test' }),
    getPaymentStatus: jest.fn().mockResolvedValue({ code: '000.000.000' }),
    processRefund: jest.fn().mockResolvedValue({ id: 'ref_hp', status: 'success' }),
  },
};

export const mockPayPalService: Provider = {
  provide: 'PAYPAL_SERVICE',
  useValue: {
    createOrder: jest.fn().mockResolvedValue({ id: 'pp_test', status: 'CREATED' }),
    captureOrder: jest.fn().mockResolvedValue({ id: 'pp_test', status: 'COMPLETED' }),
    refundOrder: jest.fn().mockResolvedValue({ id: 'ref_pp', status: 'COMPLETED' }),
  },
};

export const mockWhatsAppService: Provider = {
  provide: 'WHATSAPP_SERVICE',
  useValue: {
    sendText: jest.fn().mockResolvedValue({ messageId: 'wa_test', status: 'sent' }),
    sendTemplate: jest.fn().mockResolvedValue({ messageId: 'wa_test', status: 'sent' }),
    sendMedia: jest.fn().mockResolvedValue({ messageId: 'wa_test', status: 'sent' }),
  },
};

export const mockTwilioService: Provider = {
  provide: 'TWILIO_SERVICE',
  useValue: {
    sendSMS: jest.fn().mockResolvedValue({ sid: 'sm_test', status: 'sent' }),
    sendWhatsApp: jest.fn().mockResolvedValue({ sid: 'wa_test', status: 'sent' }),
    sendVoice: jest.fn().mockResolvedValue({ sid: 'ca_test', status: 'queued' }),
  },
};

export const mockFCMService: Provider = {
  provide: 'FCM_SERVICE',
  useValue: {
    sendPush: jest.fn().mockResolvedValue({ messageId: 'fcm_test' }),
    sendToTopic: jest.fn().mockResolvedValue({ messageId: 'fcm_topic' }),
    sendToDevice: jest.fn().mockResolvedValue({ success: true }),
  },
};

export const mockOpenAIService: Provider = {
  provide: 'OPENAI_SERVICE',
  useValue: {
    createChatCompletion: jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'AI response', role: 'assistant' } }],
      usage: { prompt_tokens: 50, completion_tokens: 100 },
    }),
    createEmbedding: jest.fn().mockResolvedValue({ data: [{ embedding: Array(1536).fill(0.1) }] }),
  },
};

export const mockAnthropicService: Provider = {
  provide: 'ANTHROPIC_SERVICE',
  useValue: {
    sendMessage: jest.fn().mockResolvedValue({ content: [{ text: 'Claude response' }] }),
  },
};

export const mockGoogleAIService: Provider = {
  provide: 'GOOGLE_AI_SERVICE',
  useValue: {
    generateContent: jest.fn().mockResolvedValue({ response: { text: () => 'Gemini response' } }),
  },
};

export const mockSIEMService: Provider = {
  provide: 'SIEM_SERVICE',
  useValue: {
    ingestEvent: jest.fn().mockResolvedValue({ id: 'siem_test', accepted: true }),
    sendToProvider: jest.fn().mockResolvedValue({ success: true }),
    getAlerts: jest.fn().mockResolvedValue([]),
  },
};

export const mockEmailService: Provider = {
  provide: 'EMAIL_SERVICE',
  useValue: {
    send: jest.fn().mockResolvedValue({ messageId: 'email_test' }),
    sendTemplate: jest.fn().mockResolvedValue({ messageId: 'email_template' }),
    sendBulk: jest.fn().mockResolvedValue({ sent: 10, failed: 0 }),
  },
};

export const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  session: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  appointment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  patient: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  notification: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  queueEntry: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  queueServicePoint: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  branch: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  report: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  reportItem: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  payment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    aggregate: jest.fn(),
  },
  invoice: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  refund: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  coupon: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  auditLog: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  doctorProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  userProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  labTest: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    groupBy: jest.fn(),
  },
  department: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  blogPost: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    groupBy: jest.fn(),
  },
  loginHistory: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  medicalHistory: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  cleanDatabase: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

export const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
  reset: jest.fn(),
  invalidatePattern: jest.fn().mockResolvedValue(undefined),
};

export const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('test-jwt-token'),
  sign: jest.fn().mockReturnValue('test-jwt-token'),
  verifyAsync: jest.fn().mockResolvedValue({ userId: 'test-user-id', email: 'test@test.com', role: 'PATIENT' }),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id', email: 'test@test.com', role: 'PATIENT' }),
  decode: jest.fn().mockReturnValue({ userId: 'test-user-id', email: 'test@test.com', role: 'PATIENT' }),
};

export const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      STRIPE_SECRET_KEY: 'sk_test',
      TAP_API_KEY: 'tap_test',
      HYPERPAY_ENTITY_ID: 'hp_test',
      PAYPAL_CLIENT_ID: 'pp_test',
      PAYPAL_CLIENT_SECRET: 'pp_secret',
      OPENAI_API_KEY: 'sk-openai-test',
      ANTHROPIC_API_KEY: 'sk-anthropic-test',
      GOOGLE_AI_API_KEY: 'sk-google-test',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      REDIS_DB: 0,
      CACHE_TTL: 60,
    };
    return config[key] ?? defaultValue;
  }),
  getOrThrow: jest.fn((key: string) => {
    const config: Record<string, any> = {
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
    };
    if (!(key in config)) throw new Error(`Config key ${key} not found`);
    return config[key];
  }),
};

export const mockGateway = {
  broadcastToBranch: jest.fn(),
  broadcastToPatient: jest.fn(),
  sendToUser: jest.fn(),
  broadcastQueueUpdate: jest.fn(),
};

export const mockBullQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  getJobs: jest.fn().mockResolvedValue([]),
  getActive: jest.fn().mockResolvedValue([]),
  getWaiting: jest.fn().mockResolvedValue([]),
  getCompleted: jest.fn().mockResolvedValue([]),
  getFailed: jest.fn().mockResolvedValue([]),
  getDelayed: jest.fn().mockResolvedValue([]),
  empty: jest.fn().mockResolvedValue(undefined),
  isReady: jest.fn().mockResolvedValue(true),
  on: jest.fn(),
  process: jest.fn(),
};

export const mockTemplateService = {
  getTemplate: jest.fn().mockResolvedValue({
    titleAr: 'مرحبا {{name}}',
    titleEn: 'Hello {{name}}',
    bodyAr: 'تأكيد الطلب رقم {{orderId}}',
    bodyEn: 'Order confirmation #{{orderId}}',
  }),
  render: jest.fn((template: string, data: Record<string, any>) => {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
  }),
};

export const mockChannelRouter = {
  resolveUserChannels: jest.fn().mockResolvedValue(['IN_APP', 'EMAIL']),
  route: jest.fn().mockResolvedValue(['EMAIL']),
};

export const mockQueueService = {
  enqueue: jest.fn().mockResolvedValue({ id: 'queue-job-1' }),
  dequeue: jest.fn().mockResolvedValue(true),
};

export const mockPreferenceService = {
  getPreferences: jest.fn().mockResolvedValue({ email: true, sms: true, push: true, whatsapp: false }),
  updatePreferences: jest.fn().mockResolvedValue({ email: true, sms: true, push: true, whatsapp: false }),
};

export const mockAnalyticsService = {
  track: jest.fn().mockResolvedValue(undefined),
  getStats: jest.fn().mockResolvedValue({ total: 100, sent: 95, failed: 5 }),
};

export const mockDigitalSignatureService = {
  sign: jest.fn().mockResolvedValue('base64-signature-data'),
  verify: jest.fn().mockResolvedValue(true),
  getPublicKey: jest.fn().mockResolvedValue('public-key-pem'),
};

export const mockPdfGeneratorService = {
  generateReport: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 test pdf content')),
  generateBilingual: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 bilingual test')),
  embedQrCode: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 with qr')),
};
