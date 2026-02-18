// lib/env.ts
// Centralized environment validation - fails fast on startup if missing required vars

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  
  // Encryption (must be exactly 32 chars for AES-256)
  ENCRYPTION_KEY: z.string().length(32, "ENCRYPTION_KEY must be exactly 32 characters"),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // GitLab (optional but recommended)
  GITLAB_URL: z.string().url().optional().default("https://gitlab.com"),
  GITLAB_TOKEN: z.string().optional(),
  GITLAB_PROJECT_ID: z.string().optional(),
  GITLAB_WEBHOOK_SECRET: z.string().optional(),
  
  // Backend Host (for webhook callbacks)
  BACKEND_HOST_URL: z.string().url().optional(),
  
  // RabbitMQ (optional)
  RABBITMQ_URL: z.string().optional(),
  
  // Feature flags
  ENABLE_WEBHOOKS: z.enum(["true", "false"]).optional().default("true"),
  AUTO_CLEANUP_ENABLED: z.enum(["true", "false"]).optional().default("true"),
  
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues.map((e: z.ZodIssue) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
      console.error('\n❌ Environment validation failed:\n' + missing + '\n');
      
      // In development, continue with warnings; in production, throw
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Missing required environment variables');
      }
    }
    // Return partial env for development
    return process.env as any;
  }
}

export const env = validateEnv();

// Type-safe environment access
export type Env = z.infer<typeof envSchema>;

// Helper to check if a feature is enabled
export const isFeatureEnabled = (feature: 'webhooks' | 'autoCleanup'): boolean => {
  switch (feature) {
    case 'webhooks':
      return env.ENABLE_WEBHOOKS === 'true';
    case 'autoCleanup':
      return env.AUTO_CLEANUP_ENABLED === 'true';
    default:
      return false;
  }
};

// Check if running in production
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
