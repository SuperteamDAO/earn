import { runtime } from '@/server/runtime';
import * as Sitemaps from '@/server/sitemaps';

export async function GET() {
  const robots = await runtime.runPromise(
    Sitemaps.Sitemaps.use((sitemaps) => sitemaps.robots),
  );
  return new Response(robots, { headers: { 'Content-Type': 'text/plain' } });
}
