// lib/rateLimit.ts
// In-memory rate limiter for API endpoints

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { tooManyRequests } from './apiResponse';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

// Store rate limit data in memory
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configurations for different endpoint types
export const RATE_LIMITS = {
  // Scan operations - expensive, limit strictly
  scan: { windowMs: 60 * 1000, maxRequests: 5 },        // 5 per minute
  
  // API endpoints - moderate limits
  api: { windowMs: 60 * 1000, maxRequests: 60 },        // 60 per minute
  
  // Webhooks - allow more (from GitLab)
  webhook: { windowMs: 60 * 1000, maxRequests: 100 },   // 100 per minute
  
  // Auth - strict to prevent brute force
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },  // 10 per 15 minutes
} as const;

/**
 * Generate rate limit key from IP and endpoint
 */
function getRateLimitKey(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`;
}

/**
 * Extract client IP from request
 */
export function getClientIP(req: Request): string {
  // Check various headers for IP (behind proxy)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback
  return 'unknown';
}

/**
 * Check if request should be rate limited
 * Returns null if allowed, or NextResponse if blocked
 */
export function checkRateLimit(
  req: Request,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMITS.api
): NextResponse | null {
  const ip = getClientIP(req);
  const key = getRateLimitKey(ip, endpoint);
  const now = Date.now();
  
  // Get or create entry
  let entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Create new window
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return null; // Allowed
  }
  
  // Increment count
  entry.count++;
  
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    logger.warn(`Rate limit exceeded for ${ip} on ${endpoint}`, {
      ip,
      endpoint,
      count: entry.count,
      limit: config.maxRequests,
    });
    
    // Return rate limit response
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMITED',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      }
    );
  }
  
  return null; // Allowed
}

/**
 * Cleanup expired entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Rate limit middleware wrapper for API routes
 */
export function withRateLimit(
  handler: (req: Request, context?: any) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMITS.api,
  endpoint?: string
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    const rateLimitResponse = checkRateLimit(
      req,
      endpoint || new URL(req.url).pathname,
      config
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    return handler(req, context);
  };
}

/**
 * Get remaining requests for current window
 */
export function getRateLimitStatus(
  req: Request,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMITS.api
): { remaining: number; resetTime: number } {
  const ip = getClientIP(req);
  const key = getRateLimitKey(ip, endpoint);
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    return {
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }
  
  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}
