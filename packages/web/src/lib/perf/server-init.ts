/* ─── Server-side performance monitoring init ─── */

const startTime = Date.now();

export function getServerUptime() {
  return Date.now() - startTime;
}

export function getServerMetrics() {
  return {
    uptime: getServerUptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
  };
}

// Log startup
console.log(`[Perf] Server initialized: pid=${process.pid}, platform=${process.platform}, node=${process.version}`);
