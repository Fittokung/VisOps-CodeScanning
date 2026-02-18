// lib/logger.ts - forcing update
// Structured logging utility for consistent log formatting

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get minimum log level from environment
const getMinLevel = (): LogLevel => {
  const level = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
  return LOG_LEVELS[level] !== undefined ? level : 'info';
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[getMinLevel()];
};

const formatLog = (entry: LogEntry): string => {
  const { timestamp, level, message, context } = entry;
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (context && Object.keys(context).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(context)}`;
  }
  return `${prefix} ${message}`;
};

const createLogEntry = (level: LogLevel, message: string, context?: LogContext): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  context,
});

const log = (level: LogLevel, message: string, context?: LogContext): void => {
  if (!shouldLog(level)) return;
  
  const entry = createLogEntry(level, message, context);
  const formatted = formatLog(entry);
  
  switch (level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
};

// Main logger export
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
  
  // Specialized loggers for common use cases
  api: {
    request: (method: string, path: string, context?: LogContext) => 
      log('info', `API ${method} ${path}`, context),
    error: (method: string, path: string, error: unknown, context?: LogContext) => 
      log('error', `API ${method} ${path} failed`, { 
        ...context, 
        error: error instanceof Error ? error.message : String(error) 
      }),
  },
  
  scan: {
    started: (scanId: string, context?: LogContext) => 
      log('info', `Scan started: ${scanId}`, context),
    completed: (scanId: string, status: string, context?: LogContext) => 
      log('info', `Scan completed: ${scanId} [${status}]`, context),
    failed: (scanId: string, error: string, context?: LogContext) => 
      log('error', `Scan failed: ${scanId}`, { ...context, error }),
  },
  
  webhook: {
    received: (pipelineId: string, status: string, context?: LogContext) => 
      log('info', `Webhook received: Pipeline ${pipelineId} [${status}]`, context),
    error: (pipelineId: string, error: string, context?: LogContext) => 
      log('error', `Webhook error: Pipeline ${pipelineId}`, { ...context, error }),
  },
};


export type Logger = typeof logger;

// --- Audit Logging (Database) ---
import { prisma } from "@/lib/prisma";

export enum AuditAction {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  SCAN_START = "SCAN_START",
  UPDATE_SETTINGS = "UPDATE_SETTINGS",
  VIEW_REPORT = "VIEW_REPORT",
  DOWNLOAD_REPORT = "DOWNLOAD_REPORT",
}

export async function logAction(
  userId: string,
  action: AuditAction | string,
  resource?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: action.toString(),
        resource,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Non-blocking
  }
}
