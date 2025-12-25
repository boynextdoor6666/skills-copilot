## Logging Configuration

Environment variables (see `.env.example`):

```
LOG_TO_FILES=true
LOG_DIR=./logs
LOG_LEVEL=info
LOG_RETENTION_DAYS_INFO=14
LOG_RETENTION_DAYS_ERROR=30
LOG_RETENTION_DAYS_AUDIT=90
```

Retention:
- info / http: 14 days
- warn / error: 30 days
- audit: 90 days

Request correlation: `x-request-id` header is accepted; if missing a UUID is generated and echoed back.

Files produced (when LOG_TO_FILES=true):
- `logs/app-info-YYYY-MM-DD.log`
- `logs/app-error-YYYY-MM-DD.log`
- `logs/audit-YYYY-MM-DD.log`

Format:
- Console: colorized text
- Files: JSON lines with timestamp, level, message

To disable file logging: set `LOG_TO_FILES=false`.
