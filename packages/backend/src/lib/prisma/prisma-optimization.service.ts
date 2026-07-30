import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaOptimizationService {
  private readonly logger = new Logger(PrismaOptimizationService.name);

  constructor(private prisma: PrismaService) {}

  async getPoolStatus() {
    try {
      const result = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
        SELECT
          count(*) AS total_connections,
          count(*) FILTER (WHERE state = 'active') AS active_connections,
          count(*) FILTER (WHERE state = 'idle') AS idle_connections,
          count(*) FILTER (WHERE wait_event_type IS NOT NULL) AS waiting_connections,
          current_setting('max_connections')::int AS max_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);
      return result[0];
    } catch (err) {
      this.logger.error(`Pool status failed: ${err}`);
      return null;
    }
  }

  async getQueryPerformance() {
    try {
      return await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
        SELECT
          queryid,
          query,
          calls,
          total_exec_time / 1000 AS total_seconds,
          mean_exec_time / 1000 AS mean_seconds,
          rows,
          shared_blks_hit,
          shared_blks_read,
          (100 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0))::numeric(5,2) AS cache_hit_ratio
        FROM pg_stat_statements
        WHERE datname = current_database()
        ORDER BY total_exec_time DESC
        LIMIT 20
      `);
    } catch {
      return [];
    }
  }

  async getIndexUsage() {
    try {
      return await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
        FROM pg_stat_user_indexes
        ORDER BY idx_scan ASC
        LIMIT 30
      `);
    } catch {
      return [];
    }
  }

  async getUnusedIndexes() {
    try {
      return await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan,
          pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
        FROM pg_stat_user_indexes
        WHERE idx_scan < 10
        ORDER BY pg_relation_size(indexname::regclass) DESC
      `);
    } catch {
      return [];
    }
  }

  async getTableStats() {
    try {
      return await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
        SELECT
          relname AS table_name,
          n_live_tup AS row_count,
          pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
          pg_size_pretty(pg_relation_size(relid)) AS table_size,
          pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size,
          (100 * seq_scan / NULLIF(seq_scan + idx_scan, 0))::numeric(5,2) AS seq_scan_pct,
          n_dead_tup AS dead_tuples,
          last_analyze,
          last_autoanalyze,
          last_vacuum,
          last_autovacuum
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
      `);
    } catch {
      return [];
    }
  }

  async getSlowQueries(thresholdMs = 1000) {
    try {
      return await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
        SELECT
          pid,
          now() - pg_stat_activity.query_start AS duration,
          query,
          state,
          wait_event_type,
          wait_event,
          usename,
          application_name
        FROM pg_stat_activity
        WHERE state != 'idle'
          AND query_start < now() - interval '1 second'
          AND query NOT LIKE '%pg_stat_activity%'
        ORDER BY query_start ASC
      `);
    } catch {
      return [];
    }
  }

  async getCacheHitRatio() {
    try {
      const result = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
        SELECT
          (sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100 AS hit_ratio
        FROM pg_statio_user_tables
      `);
      return result[0]?.hit_ratio || null;
    } catch {
      return null;
    }
  }

  async getConnectionPoolConfig() {
    return {
      recommendedMaxConnections: 25,
      recommendedMinConnections: 2,
      recommendedIdleTimeout: 30000,
      recommendedAcquireTimeout: 10000,
      currentMaxPoolSize: parseInt(process.env.DB_POOL_MAX || '20', 10),
      pgBouncerEnabled: process.env.PGBOUNCER_ENABLED === 'true',
    };
  }

  async analyzeTable(tableName: string) {
    try {
      await this.prisma.$executeRawUnsafe(`ANALYZE "${tableName}"`);
      return { table: tableName, analyzed: true };
    } catch {
      return { table: tableName, analyzed: false };
    }
  }

  async vacuumAnalyzeTable(tableName: string) {
    try {
      await this.prisma.$executeRawUnsafe(`VACUUM ANALYZE "${tableName}"`);
      return { table: tableName, vacuumed: true };
    } catch {
      return { table: tableName, vacuumed: false };
    }
  }
}
