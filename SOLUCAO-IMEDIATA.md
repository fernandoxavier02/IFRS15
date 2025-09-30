# 🚀 IFRS 15 - SOLUÇÃO IMEDIATA

## ❌ **PROBLEMA IDENTIFICADO**
Sistema não funciona porque **Node.js e Docker não estão instalados** no Windows.

## ✅ **SOLUÇÃO RÁPIDA (2 opções)**

### **OPÇÃO 1: Instalar dependências completas**
```bash
# 1. Instalar Node.js LTS
# Baixe: https://nodejs.org/

# 2. Instalar Docker Desktop  
# Baixe: https://www.docker.com/products/docker-desktop/

# 3. Executar sistema completo
start.bat
```

### **OPÇÃO 2: Modo Standalone (SEM Docker)**
```bash
# 1. Apenas instalar Node.js
# Baixe: https://nodejs.org/

# 2. Executar versão simplificada
start-standalone.bat
```

## 🔧 **COMANDOS MANUAIS (se os .bat não funcionarem)**

### Para sistema completo:
```bash
npm install
npm run docker:up
npm run db:seed  
npm run dev
```

### Para modo standalone:
```bash
npm install
copy .env.standalone .env
copy schema-sqlite.prisma packages\infra\prisma\schema.prisma
cd packages\infra
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..\..
npm run dev
```

## 🎯 **ACESSO FINAL**
- **Frontend**: http://localhost:4200
- **API**: http://localhost:3000  
- **Login**: admin@ifrs15.com / password123

## 📞 **PRÓXIMO PASSO**
1. Instale Node.js (obrigatório)
2. Execute `start-standalone.bat` (mais simples)
3. Me avise se aparecer algum erro
