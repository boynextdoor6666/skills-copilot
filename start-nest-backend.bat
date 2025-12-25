@echo off
chcp 65001 >nul
cd /d "%~dp0movie-aggregator-backend-nest"
if not exist .env (
  echo [hint] Skopirujte .env.example v .env i zadayte DB/JWT
)
call npm install
call npm run start:dev
