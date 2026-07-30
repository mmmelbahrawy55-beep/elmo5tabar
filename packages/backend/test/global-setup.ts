import { GenericContainer, StartedTestContainer } from 'testcontainers';

let postgresContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;

export default async function globalSetup(): Promise<void> {
  postgresContainer = await new GenericContainer('postgres:16-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'almokhtabar_test',
    })
    .withExposedPorts(5432)
    .start();

  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  const pgPort = postgresContainer.getMappedPort(5432);
  const redisPort = redisContainer.getMappedPort(6379);

  process.env.DATABASE_URL = `postgresql://test:test@localhost:${pgPort}/almokhtabar_test?schema=public`;
  process.env.REDIS_URL = `redis://localhost:${redisPort}`;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';

  (global as any).__POSTGRES_CONTAINER__ = postgresContainer;
  (global as any).__REDIS_CONTAINER__ = redisContainer;
}
