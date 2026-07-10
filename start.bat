@echo off
echo Starting AH Brand Store System...
echo Updating database schema...
call npx prisma db push
echo Please wait a moment while the server starts.
start http://localhost:3000
npm run dev
