# 🚀 IFRS 15 - Setup Rápido para Windows

## ❌ **PROBLEMA IDENTIFICADO**
O sistema não está funcionando porque faltam dependências básicas no Windows.

## ✅ **SOLUÇÃO IMEDIATA**

### **Passo 1: Instalar Node.js**
1. Baixe Node.js LTS: https://nodejs.org/
2. Execute o instalador (.msi)
3. Reinicie o terminal/PowerShell
4. Teste: `node --version` e `npm --version`

### **Passo 2: Instalar Docker Desktop**
1. Baixe Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Execute o instalador
3. Reinicie o computador
4. Inicie Docker Desktop
5. Teste: `docker --version`

### **Passo 3: Iniciar Sistema**
```bash
# No diretório do projeto
npm install
npm run docker:up
npm run db:seed
npm run dev
```

## 🔧 **ALTERNATIVA SEM DOCKER**
Se Docker não funcionar, posso configurar um modo "standalone" com SQLite local.

## 📞 **PRÓXIMOS PASSOS**
1. Instale Node.js e Docker
2. Execute os comandos acima
3. Me avise se algum erro aparecer

## 🎯 **ACESSO FINAL**
- Frontend: http://localhost:4200
- API: http://localhost:3000
- Login: admin@ifrs15.com / password123
