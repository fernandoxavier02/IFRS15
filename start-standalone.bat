@echo off
echo 🏠 IFRS 15 - Modo Standalone (sem Docker)
echo.

echo 📦 Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo 📥 Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

echo 📦 Instalando dependências...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)

echo.
echo 🗄️ Configurando banco SQLite local...
call npm run db:generate
call npm run db:push

echo.
echo 🌱 Carregando dados de exemplo...
call npm run db:seed

echo.
echo 🚀 Iniciando sistema...
echo.
echo ✅ Acesse: http://localhost:4200
echo 🔧 API: http://localhost:3000
echo 👤 Login: admin@ifrs15.com / password123
echo.
echo Pressione Ctrl+C para parar
echo.

call npm run dev
