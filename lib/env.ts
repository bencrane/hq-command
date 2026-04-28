import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_HQX_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_HQX_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_DEX_API_BASE_URL: z.string().url(),
  HQX_API_BASE_URL: z.string().url(),
  APP_ENV: z.enum(['dev', 'stg', 'prd']),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_HQX_SUPABASE_URL: process.env.NEXT_PUBLIC_HQX_SUPABASE_URL,
  NEXT_PUBLIC_HQX_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_HQX_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_DEX_API_BASE_URL: process.env.NEXT_PUBLIC_DEX_API_BASE_URL,
  HQX_API_BASE_URL: process.env.HQX_API_BASE_URL,
  APP_ENV: process.env.APP_ENV,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(`Invalid environment: ${issues}`);
}

export const env = parsed.data;
