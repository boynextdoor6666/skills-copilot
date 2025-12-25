import * as path from 'path';
import * as fs from 'fs';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const LOG_DIR = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs');
const LOG_TO_FILES = (process.env.LOG_TO_FILES || (process.env.NODE_ENV === 'production' ? 'true' : 'false')).toLowerCase() === 'true';

const RETENTION_INFO = parseInt(process.env.LOG_RETENTION_DAYS_INFO || '14', 10);
const RETENTION_ERROR = parseInt(process.env.LOG_RETENTION_DAYS_ERROR || '30', 10);
const RETENTION_AUDIT = parseInt(process.env.LOG_RETENTION_DAYS_AUDIT || '90', 10);

// Ensure log directory exists
if (LOG_TO_FILES) {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}
}

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level} ${message}`;
  }),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: consoleFormat,
  }),
];

if (LOG_TO_FILES) {
  transports.push(
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'app-info-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: `${RETENTION_INFO}d`,
      level: 'info',
      format: fileFormat,
      zippedArchive: false,
    }),
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'app-error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: `${RETENTION_ERROR}d`,
      level: 'warn',
      format: fileFormat,
      zippedArchive: false,
    }),
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: `${RETENTION_AUDIT}d`,
      level: 'info',
      format: fileFormat,
    }),
  );
}

export const appLogger = winston.createLogger({
  levels: winston.config.npm.levels,
  transports,
});

export const auditLogger = appLogger.child({ channel: 'audit' });
