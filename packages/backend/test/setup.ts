import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });

  await prisma.$connect();
});

afterAll(async () => {
  await prisma.cleanDatabase();
  await prisma.$disconnect();
});

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
      confirm: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
      cancel: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'canceled' }),
    },
    refunds: {
      create: jest.fn().mockResolvedValue({ id: 're_test', status: 'succeeded' }),
    },
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test' }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.com/test' }),
      },
    },
  }));
});

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response', role: 'assistant' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      },
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.1) }],
      }),
    },
  }));
});

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Test response' }],
      }),
    },
  }));
});

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => 'Test response' },
      }),
    }),
  })),
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-msg-id' }),
  }),
}));
