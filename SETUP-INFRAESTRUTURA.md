# 🐳 Guia de Configuração de Infraestrutura - IFRS 15

**Data:** 12 de Dezembro de 2025  
**Status:** Pronto para Execução

---

## 📋 Pré-requisitos

### Software Necessário
- ✅ Node.js 18+ (instalado)
- ✅ npm 9+ (instalado)
- ⚠️ Docker Desktop (não disponível no ambiente sandbox)
- ⚠️ Docker Compose (não disponível no ambiente sandbox)

---

## 🚀 Configuração Passo a Passo

### 1️⃣ Instalar Docker (Ambiente Local)

#### Windows
```bash
# Baixar Docker Desktop
# https://www.docker.com/products/docker-desktop/

# Ou via Chocolatey
choco install docker-desktop
```

#### macOS
```bash
# Via Homebrew
brew install --cask docker
```

#### Linux (Ubuntu/Debian)
```bash
# Instalar Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2️⃣ Iniciar Serviços de Infraestrutura

```bash
# Navegar para o diretório do projeto
cd /home/user/webapp

# Iniciar todos os serviços
docker compose up -d

# Verificar status dos serviços
docker compose ps

# Ver logs dos serviços
docker compose logs -f
```

### 3️⃣ Serviços Disponíveis

| Serviço | URL | Porta | Descrição |
|---------|-----|-------|-----------|
| PostgreSQL | localhost:5432 | 5432 | Banco de dados principal |
| Keycloak | http://localhost:8080 | 8080 | Autenticação OIDC |
| Redis | localhost:6379 | 6379 | Cache e sessões |
| Jaeger | http://localhost:16686 | 16686 | Distributed tracing |
| Prometheus | http://localhost:9090 | 9090 | Métricas |
| Grafana | http://localhost:3001 | 3001 | Dashboards |

### 4️⃣ Configurar Banco de Dados

```bash
# Gerar Prisma Client
npm run db:generate

# Aplicar schema ao banco
npm run db:push

# Executar migrations (se houver)
npm run db:migrate

# Popular banco com dados de teste
npm run db:seed
```

### 5️⃣ Verificar Configuração

```bash
# Testar conexão com PostgreSQL
docker compose exec postgres psql -U ifrs15_user -d ifrs15_db -c "SELECT version();"

# Testar Redis
docker compose exec redis redis-cli ping

# Verificar Keycloak
curl http://localhost:8080/health/ready
```

---

## 🔧 Configuração Alternativa (Sem Docker)

Se não puder usar Docker, você pode configurar os serviços localmente:

### PostgreSQL Local

#### Windows
```bash
# Via Chocolatey
choco install postgresql

# Criar banco de dados
psql -U postgres
CREATE DATABASE ifrs15_db;
CREATE USER ifrs15_user WITH PASSWORD 'ifrs15_password';
GRANT ALL PRIVILEGES ON DATABASE ifrs15_db TO ifrs15_user;
```

#### macOS
```bash
# Via Homebrew
brew install postgresql@15
brew services start postgresql@15

# Criar banco de dados
createdb ifrs15_db
psql ifrs15_db
CREATE USER ifrs15_user WITH PASSWORD 'ifrs15_password';
GRANT ALL PRIVILEGES ON DATABASE ifrs15_db TO ifrs15_user;
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-15

# Criar banco de dados
sudo -u postgres psql
CREATE DATABASE ifrs15_db;
CREATE USER ifrs15_user WITH PASSWORD 'ifrs15_password';
GRANT ALL PRIVILEGES ON DATABASE ifrs15_db TO ifrs15_user;
```

### Atualizar .env
```bash
# Editar .env com configuração local
DATABASE_URL=postgresql://ifrs15_user:ifrs15_password@localhost:5432/ifrs15_db
```

---

## 📊 Scripts Disponíveis

### Database Management
```bash
# Gerar Prisma Client
npm run db:generate

# Aplicar schema (sem migrations)
npm run db:push

# Criar nova migration
npm run db:migrate

# Aplicar migrations em dev
npm run db:migrate:dev

# Reset completo do banco
npm run db:migrate:reset

# Popular com dados de teste
npm run db:seed

# Abrir Prisma Studio (GUI)
npm run db:studio
```

### Infrastructure
```bash
# Iniciar todos os serviços
npm run docker:up
# ou
docker compose up -d

# Parar todos os serviços
npm run docker:down
# ou
docker compose down

# Ver logs
npm run docker:logs
# ou
docker compose logs -f

# Rebuild containers
npm run docker:rebuild
# ou
docker compose up -d --build
```

---

## 🔐 Credenciais Padrão

### PostgreSQL
```
Host: localhost
Port: 5432
Database: ifrs15_db
Username: ifrs15_user
Password: ifrs15_password
```

### Keycloak Admin
```
URL: http://localhost:8080
Username: admin
Password: admin123
Realm: ifrs15
```

### Keycloak Realm (IFRS15)
```
Client ID: ifrs15-api
Client Secret: dev-client-secret
```

### Redis
```
Host: localhost
Port: 6379
Password: (none)
```

### Grafana
```
URL: http://localhost:3001
Username: admin
Password: admin
```

---

## 🐛 Troubleshooting

### Problema: Porta já em uso

```bash
# Verificar o que está usando a porta
lsof -i :5432  # PostgreSQL
lsof -i :8080  # Keycloak
lsof -i :6379  # Redis

# Parar o processo
kill -9 <PID>
```

### Problema: PostgreSQL não aceita conexões

```bash
# Verificar status do container
docker compose ps postgres

# Ver logs
docker compose logs postgres

# Restart do serviço
docker compose restart postgres
```

### Problema: Keycloak demora para iniciar

```bash
# Keycloak pode levar 1-2 minutos na primeira inicialização
# Verificar logs
docker compose logs -f keycloak

# Aguardar mensagem "Keycloak ... started"
```

### Problema: Prisma não conecta ao banco

```bash
# Verificar variável DATABASE_URL
echo $DATABASE_URL

# Ou no .env
cat .env | grep DATABASE_URL

# Testar conexão manual
psql postgresql://ifrs15_user:ifrs15_password@localhost:5432/ifrs15_db

# Regenerar Prisma Client
npm run db:generate
```

---

## 📝 Checklist de Configuração

### Antes de Desenvolver
- [ ] Docker Desktop instalado e rodando
- [ ] Containers iniciados (`docker compose up -d`)
- [ ] PostgreSQL respondendo (porta 5432)
- [ ] Keycloak acessível (porta 8080)
- [ ] Redis rodando (porta 6379)
- [ ] Arquivo .env configurado
- [ ] Prisma Client gerado (`npm run db:generate`)
- [ ] Schema aplicado ao banco (`npm run db:push`)
- [ ] Dados de seed carregados (`npm run db:seed`)

### Verificação Rápida
```bash
# Script de verificação completa
cd /home/user/webapp

# 1. Verificar serviços Docker
docker compose ps

# 2. Testar PostgreSQL
docker compose exec postgres pg_isready

# 3. Testar Redis
docker compose exec redis redis-cli ping

# 4. Verificar Keycloak
curl -f http://localhost:8080/health/ready

# Se todos responderem OK, você está pronto! ✅
```

---

## 🎯 Próximos Passos

Após configurar a infraestrutura:

1. ✅ Verificar que todos os serviços estão rodando
2. ✅ Gerar e aplicar schema Prisma
3. ✅ Popular banco com dados de teste
4. 🔄 Implementar integração real com APIs
5. 🔄 Remover dados mockados
6. 🔄 Testar autenticação com Keycloak

---

## 📞 Suporte

Para problemas ou dúvidas:
- 📖 Documentação Docker: https://docs.docker.com
- 📖 Documentação Prisma: https://www.prisma.io/docs
- 📖 Documentação Keycloak: https://www.keycloak.org/docs

---

**Status:** ✅ Guia completo criado  
**Próximo:** Implementar integração com APIs reais
