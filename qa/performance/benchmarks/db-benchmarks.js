const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'almokhtabar',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const REPORT_FILE = path.join(__dirname, '../../reports/db-benchmark-results.json');

const CRITICAL_QUERIES = [
  {
    name: 'Patient search by ID number',
    query: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT "Patient".* FROM "Patient"
      WHERE "idNumber" = '1234567890'
      AND "isActive" = true
      LIMIT 1;`,
  },
  {
    name: 'Available slots query',
    query: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT s.* FROM "AppointmentSlot" s
      WHERE s."branchId" = 'BR-0001'
      AND s."date" = '2026-08-01'
      AND s."isAvailable" = true
      AND s."isActive" = true
      ORDER BY s."startTime" ASC;`,
  },
  {
    name: 'Patient appointments with results',
    query: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT a.*, r.status as resultStatus
      FROM "Appointment" a
      LEFT JOIN "Result" r ON r."appointmentId" = a.id
      WHERE a."patientId" = 'PAT-001'
      AND a."isActive" = true
      ORDER BY a."createdAt" DESC
      LIMIT 20;`,
  },
  {
    name: 'Pending queue count',
    query: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT COUNT(*) as queue_count
      FROM "Appointment"
      WHERE "branchId" = 'BR-0001'
      AND "date" = CURRENT_DATE
      AND "status" IN ('pending', 'checked_in', 'in_progress')
      AND "isActive" = true;`,
  },
  {
    name: 'Search tests by name (full-text)',
    query: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT * FROM "LabTest"
      WHERE "name" ILIKE '%blood%'
      OR "nameAr" ILIKE '%دم%'
      AND "isActive" = true
      ORDER BY "popularity" DESC
      LIMIT 20;`,
  },
  {
    name: 'Revenue aggregation by branch',
    query: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT b."nameAr" as branch,
             COUNT(p.id) as transactions,
             SUM(p."amount") as total_revenue,
             AVG(p."amount") as avg_transaction
      FROM "Payment" p
      JOIN "Branch" b ON b.id = p."branchId"
      WHERE p."createdAt" >= '2026-01-01'
      AND p."createdAt" < '2026-08-01'
      AND p."status" = 'completed'
      AND p."isActive" = true
      GROUP BY b."nameAr"
      ORDER BY total_revenue DESC;`,
  },
  {
    name: 'Doctor schedule with appointments',
    query: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT d.*, a."startTime", a."endTime", a.status
      FROM "Doctor" d
      JOIN "Appointment" a ON a."doctorId" = d.id
      WHERE d."branchId" = 'BR-0001'
      AND a."date" = '2026-08-01'
      AND a."isActive" = true
      ORDER BY a."startTime" ASC;`,
  },
];

const INDEX_USAGE_QUERY = `
  SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan ASC
  LIMIT 50;
`;

const SEQ_SCAN_QUERY = `
  SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    (100 * idx_scan / NULLIF(seq_scan + idx_scan, 0))::numeric(5,2) as idx_scan_pct
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  AND (seq_scan + idx_scan) > 0
  ORDER BY seq_scan DESC
  LIMIT 30;
`;

const CACHE_HIT_QUERY = `
  SELECT
    'index hit rate' as name,
    (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read), 0)::numeric as ratio
  FROM pg_statio_user_indexes
  UNION ALL
  SELECT
    'table hit rate' as name,
    sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0)::numeric as ratio
  FROM pg_statio_user_sequences;
`;

const CONNECTION_POOL_QUERY = `
  SELECT
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections,
    count(*) FILTER (WHERE wait_event IS NOT NULL) as waiting_connections,
    count(*) FILTER (WHERE state = 'active' AND wait_event IS NOT NULL) as blocked_queries
  FROM pg_stat_activity
  WHERE backend_type = 'client backend';
`;

const SLOW_QUERY_LOG = `
  SELECT
    queryid,
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    min_exec_time,
    max_exec_time,
    stddev_exec_time,
    rows,
    shared_blks_hit,
    shared_blks_read,
    (100 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0))::numeric(5,2) as cache_hit_ratio
  FROM pg_stat_statements
  WHERE mean_exec_time > 100
  ORDER BY mean_exec_time DESC
  LIMIT 30;
`;

async function executeQuery(client, query) {
  try {
    const start = process.hrtime.bigint();
    const result = await client.query(query);
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    return { success: true, durationMs, rows: result.rows };
  } catch (error) {
    return { success: false, durationMs: 0, error: error.message, rows: [] };
  }
}

function analyzeExplainPlan(rows) {
  if (!rows || rows.length === 0) return null;
  try {
    const plan = typeof rows[0] === 'string' ? JSON.parse(rows[0]) : rows[0];
    const planNode = plan[0]?.Plan || plan?.Plan || plan;
    return {
      totalCost: planNode['Total Cost'] || planNode['Total Cost'] || 0,
      startupCost: planNode['Startup Cost'] || 0,
      planRows: planNode['Plan Rows'] || 0,
      planWidth: planNode['Plan Width'] || 0,
      nodeType: planNode['Node Type'] || '',
      actualTotalTime: planNode['Actual Total Time'] || 0,
      actualRows: planNode['Actual Rows'] || 0,
      actualLoops: planNode['Actual Loops'] || 1,
      buffersHit: plan['Shared Hit Blocks'] || 0,
      buffersRead: plan['Shared Read Blocks'] || 0,
    };
  } catch {
    return null;
  }
}

function analyzeIndexUsage(rows) {
  return (rows || []).map(r => ({
    table: `${r.schemaname}.${r.tablename}`,
    index: r.indexname,
    scans: r.idx_scan,
    tuplesRead: r.idx_tup_read,
    tuplesFetched: r.idx_tup_fetch,
    size: r.index_size,
    usageScore: r.idx_scan > 0 ? 'USED' : 'UNUSED',
  }));
}

function analyzeSeqScans(rows) {
  return (rows || []).map(r => ({
    table: `${r.schemaname}.${r.tablename}`,
    seqScans: r.seq_scan,
    seqTuples: r.seq_tup_read,
    idxScans: r.idx_scan,
    idxScanPct: parseFloat(r.idx_scan_pct || '0'),
    recommendation: parseFloat(r.idx_scan_pct || '0') < 90 ? 'MISSING INDEX' : 'OK',
  }));
}

async function run() {
  console.log('========================================');
  console.log('  Database Performance Benchmarks');
  console.log(`  Target: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('========================================\n');

  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    console.log('Connected to database.\n');

    const results = {};

    // 1. Query execution plans
    console.log('--- Query Execution Plans ---');
    const queryResults = [];
    for (const q of CRITICAL_QUERIES) {
      process.stdout.write(`  ${q.name}... `);
      const result = await executeQuery(client, q.query);
      if (result.success) {
        const analysis = analyzeExplainPlan(result.rows);
        queryResults.push({
          name: q.name,
          durationMs: result.durationMs,
          planAnalysis: analysis,
        });
        if (analysis) {
          console.log(`${analysis.actualTotalTime.toFixed(2)}ms (cost=${analysis.totalCost.toFixed(2)}, rows=${analysis.planRows})`);
        } else {
          console.log(`${result.durationMs.toFixed(2)}ms (raw plan)`);
        }
      } else {
        console.log(`ERROR: ${result.error}`);
        queryResults.push({ name: q.name, error: result.error });
      }
    }
    results.queries = queryResults;

    // 2. Index usage analysis
    console.log('\n--- Index Usage Analysis ---');
    const idxResult = await executeQuery(client, INDEX_USAGE_QUERY);
    if (idxResult.success) {
      const idxAnalysis = analyzeIndexUsage(idxResult.rows);
      results.indexUsage = idxAnalysis;
      const unused = idxAnalysis.filter(i => i.usageScore === 'UNUSED');
      console.log(`  Total indexes: ${idxAnalysis.length}`);
      console.log(`  Unused indexes: ${unused.length}`);
      if (unused.length > 0) {
        console.log('  Unused indexes:');
        unused.slice(0, 10).forEach(i => console.log(`    - ${i.table}.${i.index} (0 scans)`));
      }
    }

    // 3. Sequential scan detection
    console.log('\n--- Sequential Scan Analysis ---');
    const seqResult = await executeQuery(client, SEQ_SCAN_QUERY);
    if (seqResult.success) {
      const seqAnalysis = analyzeSeqScans(seqResult.rows);
      results.seqScans = seqAnalysis;
      const missingIndex = seqAnalysis.filter(s => s.recommendation === 'MISSING INDEX');
      console.log(`  Tables with seq scans: ${seqAnalysis.length}`);
      console.log(`  Missing indexes: ${missingIndex.length}`);
      if (missingIndex.length > 0) {
        console.log('  Tables needing indexes:');
        missingIndex.slice(0, 10).forEach(t => console.log(`    - ${t.table} (${t.seqScans} seq scans, ${t.idxScanPct}% index)`));
      }
    }

    // 4. Cache hit ratio
    console.log('\n--- Cache Hit Ratio ---');
    const cacheResult = await executeQuery(client, CACHE_HIT_QUERY);
    if (cacheResult.success) {
      results.cacheHit = cacheResult.rows;
      cacheResult.rows.forEach(r => {
        const ratio = (parseFloat(r.ratio) * 100).toFixed(2);
        console.log(`  ${r.name}: ${ratio}%`);
      });
    }

    // 5. Connection pool utilization
    console.log('\n--- Connection Pool ---');
    const connResult = await executeQuery(client, CONNECTION_POOL_QUERY);
    if (connResult.success) {
      results.connectionPool = connResult.rows[0];
      const c = connResult.rows[0];
      console.log(`  Total connections: ${c.total_connections}`);
      console.log(`  Active: ${c.active_connections}`);
      console.log(`  Idle: ${c.idle_connections}`);
      console.log(`  Waiting: ${c.waiting_connections}`);
      console.log(`  Blocked: ${c.blocked_queries}`);
    }

    // 6. Slow query log
    console.log('\n--- Slow Query Log (>100ms avg) ---');
    const slowResult = await executeQuery(client, SLOW_QUERY_LOG);
    if (slowResult.success) {
      results.slowQueries = slowResult.rows;
      console.log(`  Slow queries found: ${slowResult.rows.length}`);
      slowResult.rows.slice(0, 10).forEach((q, i) => {
        const shortQuery = q.query.length > 80 ? q.query.substring(0, 80) + '...' : q.query;
        console.log(`  ${i + 1}. [${q.mean_exec_time.toFixed(2)}ms avg, ${q.calls} calls] ${shortQuery}`);
      });
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      database: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`,
      criticalQueries: CRITICAL_QUERIES.length,
      results,
    };

    fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
    console.log(`\nReport saved: ${REPORT_FILE}`);

    // Summary
    console.log('\n========================================');
    console.log('  DB Benchmark Summary');
    console.log('========================================');

    const avgQueryTime = queryResults.filter(r => r.planAnalysis).reduce((sum, r) => sum + (r.planAnalysis?.actualTotalTime || 0), 0) / queryResults.filter(r => r.planAnalysis).length;
    console.log(`  Avg query execution time: ${avgQueryTime.toFixed(2)}ms`);
    const cacheRatios = results.cacheHit || [];
    cacheRatios.forEach(r => console.log(`  ${r.name}: ${(parseFloat(r.ratio) * 100).toFixed(2)}%`));

    if (results.slowQueries && results.slowQueries.length > 0) {
      console.log(`  WARNING: ${results.slowQueries.length} slow queries detected (>100ms avg)`);
    }

  } catch (error) {
    console.error('Database benchmark failed:', error.message);
    console.log('Skipping DB benchmarks (database may not be accessible).');
  } finally {
    await client.end();
  }
}

run().catch(console.error);
