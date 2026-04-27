import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'ok', env: env.APP_ENV });
}
