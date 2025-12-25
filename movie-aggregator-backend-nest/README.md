# Movie Aggregator Backend (NestJS)

This is a NestJS rewrite of the Spring Boot backend.

## Setup

1) Copy `.env.example` to `.env` and set MySQL/JWT values.
2) Install deps:
```bash
npm install
```
3) Run in dev:
```bash
npm run start:dev
```
API: http://localhost:8080
Swagger: http://localhost:8080/swagger

## Notes
- Uses TypeORM with MySQL, no auto-sync in prod (synchronize=false). Ensure DB schema exists (from your current warehouse).
- Auth endpoints:
  - POST /api/auth/login { usernameOrEmail, password }
  - POST /api/auth/register { username, email, password }
  - GET /api/auth/validate (Bearer token)
