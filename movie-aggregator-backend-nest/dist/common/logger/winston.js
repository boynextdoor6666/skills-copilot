"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.appLogger = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const LOG_DIR = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs');
const LOG_TO_FILES = (process.env.LOG_TO_FILES || (process.env.NODE_ENV === 'production' ? 'true' : 'false')).toLowerCase() === 'true';
const RETENTION_INFO = parseInt(process.env.LOG_RETENTION_DAYS_INFO || '14', 10);
const RETENTION_ERROR = parseInt(process.env.LOG_RETENTION_DAYS_ERROR || '30', 10);
const RETENTION_AUDIT = parseInt(process.env.LOG_RETENTION_DAYS_AUDIT || '90', 10);
if (LOG_TO_FILES) {
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    catch { }
}
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level} ${message}`;
}));
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json());
const transports = [
    new winston_1.default.transports.Console({
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        format: consoleFormat,
    }),
];
if (LOG_TO_FILES) {
    transports.push(new winston_daily_rotate_file_1.default({
        dirname: LOG_DIR,
        filename: 'app-info-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: `${RETENTION_INFO}d`,
        level: 'info',
        format: fileFormat,
        zippedArchive: false,
    }), new winston_daily_rotate_file_1.default({
        dirname: LOG_DIR,
        filename: 'app-error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: `${RETENTION_ERROR}d`,
        level: 'warn',
        format: fileFormat,
        zippedArchive: false,
    }), new winston_daily_rotate_file_1.default({
        dirname: LOG_DIR,
        filename: 'audit-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: `${RETENTION_AUDIT}d`,
        level: 'info',
        format: fileFormat,
    }));
}
exports.appLogger = winston_1.default.createLogger({
    levels: winston_1.default.config.npm.levels,
    transports,
});
exports.auditLogger = exports.appLogger.child({ channel: 'audit' });
//# sourceMappingURL=winston.js.map