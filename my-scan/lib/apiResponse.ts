// lib/apiResponse.ts
// Standardized API response helpers for consistent error handling

import { NextResponse } from 'next/server';

// Standard response types
interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// HTTP Status codes as constants
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

type HttpStatusCode = typeof HttpStatus[keyof typeof HttpStatus];

// Success responses
export function success<T>(data?: T, message?: string, status: number = HttpStatus.OK) {
  const body: SuccessResponse<T> = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  return NextResponse.json(body, { status });
}

export function created<T>(data?: T, message = 'Created successfully') {
  return success(data, message, HttpStatus.CREATED);
}

// Error responses
export function error(
  message: string, 
  status: number = HttpStatus.BAD_REQUEST,
  code?: string,
  details?: unknown
) {
  const body: ErrorResponse = { success: false, error: message };
  if (code) body.code = code;
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}

export function unauthorized(message = 'Unauthorized') {
  return error(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
}

export function forbidden(message = 'Access denied') {
  return error(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
}

export function notFound(resource = 'Resource') {
  return error(`${resource} not found`, HttpStatus.NOT_FOUND, 'NOT_FOUND');
}

export function conflict(message: string) {
  return error(message, HttpStatus.CONFLICT, 'CONFLICT');
}

export function tooManyRequests(message = 'Rate limit exceeded') {
  return error(message, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
}

export function internalError(message = 'Internal server error') {
  return error(message, HttpStatus.INTERNAL_ERROR, 'INTERNAL_ERROR');
}

export function serviceUnavailable(message = 'Service temporarily unavailable') {
  return error(message, HttpStatus.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
}

// Validation error helper
export function validationError(errors: Record<string, string>) {
  return error('Validation failed', HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', errors);
}

// Type guard to check response type
export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return !response.success;
}

// Re-export response type for external use
export type { ApiResponse, SuccessResponse, ErrorResponse, HttpStatusCode };
