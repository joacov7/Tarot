import { z } from 'zod';

/**
 * Validación tipada de variables de entorno.
 * - `publicEnv`: seguro para el cliente (solo NEXT_PUBLIC_*).
 * - `serverEnv`: SOLO servidor/worker; incluye secretos. Nunca importar en el cliente.
 *
 * Se validan de forma perezosa para no romper el build cuando faltan secretos
 * (p. ej. en CI que solo hace typecheck/lint).
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url().optional(),

  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  AI_PROVIDER: z.enum(['openai']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL_EXPRESS: z.string().default('gpt-4o-mini'),
  AI_MODEL_PREMIUM: z.string().default('gpt-4o'),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema> & PublicEnv;

let _publicEnv: PublicEnv | null = null;
let _serverEnv: ServerEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (_publicEnv) return _publicEnv;
  _publicEnv = publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    APP_BASE_URL: process.env.APP_BASE_URL,
  });
  return _publicEnv;
}

export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;
  const pub = getPublicEnv();
  const srv = serverSchema.parse(process.env);
  _serverEnv = { ...pub, ...srv };
  return _serverEnv;
}
