import { StartedTestContainer } from 'testcontainers';

export default async function globalTeardown(): Promise<void> {
  const postgresContainer: StartedTestContainer | undefined = (global as any).__POSTGRES_CONTAINER__;
  const redisContainer: StartedTestContainer | undefined = (global as any).__REDIS_CONTAINER__;

  if (postgresContainer) {
    await postgresContainer.stop();
  }

  if (redisContainer) {
    await redisContainer.stop();
  }
}
