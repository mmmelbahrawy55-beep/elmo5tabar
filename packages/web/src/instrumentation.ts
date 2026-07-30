/* ─── Next.js Instrumentation Hook (monitoring init) ─── */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/perf/server-init');
  }
}
