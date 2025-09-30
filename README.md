# IFRS 15 Revenue Recognition System

A production-ready monorepo for IFRS 15 compliant revenue recognition with Angular frontend, NestJS backend, and comprehensive observability.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Angular Web   │    │   NestJS API    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                  # 🏦 IFRS 15 Revenue Recognition - Production-Ready Monorepo

[![CI/CD Pipeline](https://github.com/your-org/ifrs15/workflows/IFRS%2015%20CI%2FCD%20Pipeline/badge.svg)](https://github.com/your-org/ifrs15/actions)
[![codecov](https://codecov.io/gh/your-org/ifrs15/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/ifrs15)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

A comprehensive, production-ready monorepo for IFRS 15 Revenue Recognition system built with modern technologies and best practices.

## 🚀 **Features**

### 🎯 **Core Functionality**
- ✅ **Complete IFRS 15 Implementation** - Full 5-step revenue recognition model
- ✅ **Multi-tenant Architecture** - Row Level Security with tenant isolation
- ✅ **Contract Management** - Performance obligations tracking and validation
- ✅ **Revenue Recognition** - Automated allocation and timing calculations
- ✅ **Audit Logging** - Comprehensive compliance and audit trails

### 🏗️ **Architecture & Technology**
- ✅ **Frontend**: Angular 17 + Angular Material + i18n (pt-BR/en)
- ✅ **Backend**: NestJS + TypeScript + Prisma ORM + Zod validation
- ✅ **Database**: PostgreSQL with Row Level Security (RLS)
- ✅ **Authentication**: OIDC (Keycloak) + JWT + RBAC (5 roles)
- ✅ **Observability**: Pino + OpenTelemetry + Prometheus + Jaeger
- ✅ **Infrastructure**: Docker Compose + Production-ready containers

### 🔧 **Development Experience**
- ✅ **Monorepo**: NX workspace with optimized builds and caching
- ✅ **Code Quality**: ESLint + Prettier + Husky + Conventional Commits
- ✅ **Testing**: Jest + Vitest + Pact + E2E + Performance tests
- ✅ **CI/CD**: GitHub Actions with security scanning and deployment
- ✅ **Documentation**: Swagger/OpenAPI + Comprehensive guides

## 📁 **Monorepo Structure**

```
ifrs15/
├── 📱 apps/
│   ├── web/                    # Angular 17 Frontend
│   │   ├── src/
│   │   │   ├── app/           # Application modules
│   │   │   ├── assets/        # Static assets
│   │   │   ├── locales/       # i18n translations
│   │   │   └── environments/  # Environment configs
│   │   ├── Dockerfile         # Production container
│   │   └── nginx.conf         # Web server config
│   │
│   └── api/                   # NestJS Backend
│       ├── src/
│       │   ├── auth/          # Authentication & authorization
│       │   ├── contracts/     # Contract management
│       │   ├── customers/     # Customer management
│       │   ├── revenue/       # Revenue recognition
│       │   ├── health/        # Health checks
│       │   ├── telemetry/     # Observability
│       │   └── database/      # Database connection
│       ├── Dockerfile         # Production container
│       └── jest.config.ts     # Test configuration
│
├── 📦 packages/
│   ├── shared/                # Shared Types & Utilities
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── enums.ts          # Application enums
│   │   ├── schemas.ts        # Zod validation schemas
│   │   └── constants.ts      # Application constants
│   │
│   ├── domain/               # Pure IFRS 15 Business Logic
│   │   ├── entities/         # Domain entities
│   │   ├── services/         # Business services
│   │   ├── repositories/     # Repository interfaces
│   │   ├── events/           # Domain events
│   │   └── value-objects/    # Value objects
│   │
│   ├── infra/                # Infrastructure & Database
│   │   ├── prisma/           # Database schema & migrations
│   │   ├── database/         # Database services & RLS
│   │   ├── repositories/     # Repository implementations
│   │   └── seed.ts           # Database seeding
│   │
│   └── ui/                   # Shared UI Components
│       ├── components/       # Reusable components
│       ├── directives/       # Angular directives
│       ├── pipes/            # Angular pipes
│       └── themes/           # Material Design themes
│
├── 🐳 docker/                # Docker Configuration
│   ├── postgres/             # PostgreSQL setup
│   ├── keycloak/             # Keycloak configuration
│   ├── redis/                # Redis configuration
│   ├── prometheus/           # Metrics collection
│   ├── grafana/              # Dashboards
│   └── nginx/                # Reverse proxy
│
├── 🔄 .github/workflows/     # CI/CD Pipelines
├── 📚 docs/                  # Documentation
└── 🧪 tests/                 # Test suites
```

## 🎯 **IFRS 15 Implementation**

The system implements the complete **5-step IFRS 15 revenue recognition model**:

```mermaid
graph TD
    A[1. Identify Contract] --> B[2. Identify Performance Obligations]
    B --> C[3. Determine Transaction Price]
    C --> D[4. Allocate Transaction Price]
    D --> E[5. Recognize Revenue]
    
    A --> A1[Contract Validation]
    A --> A2[Commercial Substance]
    A --> A3[Payment Terms]
    
    B --> B1[Distinct Goods/Services]
    B --> B2[Bundle Analysis]
    B --> B3[Series of Distinct Goods]
    
    C --> C1[Variable Consideration]
    C --> C2[Significant Financing]
    C --> C3[Non-cash Consideration]
    
    D --> D1[Standalone Selling Price]
    D --> D2[Allocation Methods]
    D --> D3[Discount Allocation]
    
    E --> E1[Over Time Recognition]
    E --> E2[Point in Time Recognition]
    E --> E3[Progress Measurement]
```

## ⚡ **Quick Start**

### 📋 **Prerequisites**

- **Node.js** 18+ and **npm** 9+
- **Docker** and **Docker Compose**
- **Git**

### 🚀 **Installation**

```bash
# 1. Clone the repository
git clone https://github.com/your-org/ifrs15.git
cd ifrs15

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env

# 4. Start infrastructure services
npm run docker:up

# 5. Setup database
npm run db:generate
npm run db:push
npm run db:seed

# 6. Start development servers
npm run dev
```

### 🌐 **Access Points**

| Service | URL | Description |
|---------|-----|-------------|
| 🖥️ **Frontend** | http://localhost:4200 | Angular application |
| 🔌 **API** | http://localhost:3000/api/v1 | NestJS backend |
| 📖 **Swagger** | http://localhost:3000/api/docs | API documentation |
| 🔐 **Keycloak** | http://localhost:8080 | Authentication server |
| 📊 **Jaeger** | http://localhost:16686 | Distributed tracing |
| 📈 **Prometheus** | http://localhost:9090 | Metrics collection |
| 📉 **Grafana** | http://localhost:3001 | Metrics visualization |

## 🛠️ **Available Scripts**

### 🏃 **Development**
```bash
npm run dev              # Start both frontend and backend
npm run dev:api          # Start only NestJS API
npm run dev:web          # Start only Angular frontend
npm run dev:docs         # Start documentation server
```

### 🏗️ **Building**
```bash
npm run build            # Build all applications
npm run build:prod       # Build for production
npm run build:api        # Build only API
npm run build:web        # Build only frontend
```

### 🧪 **Testing**
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run with coverage report
npm run test:e2e         # Run end-to-end tests
npm run test:pact        # Run contract tests
```

### 🗄️ **Database**
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed with demo data
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database
```

### 🐳 **Docker**
```bash
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:logs      # View service logs
npm run docker:rebuild   # Rebuild containers
npm run infra:up         # Start only infrastructure
```

### 🔍 **Code Quality**
```bash
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues
npm run format           # Format with Prettier
npm run typecheck        # TypeScript checking
npm run security:audit   # Security audit
```

## 🔐 **Authentication & Authorization**

### 👥 **RBAC Roles**

| Role | Permissions | Description |
|------|-------------|-------------|
| **admin_org** | Full system access | System administration |
| **gerente_financeiro** | Financial management | Revenue oversight |
| **contabilidade** | Revenue recognition | Accounting operations |
| **auditor_externo** | Read-only access | External audit |
| **cliente** | Customer portal | Customer self-service |

### 🎭 **Demo Users**

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| admin@demo.com | admin123 | admin_org | Full system |
| financeiro@demo.com | financeiro123 | gerente_financeiro | Financial mgmt |
| contabilidade@demo.com | contador123 | contabilidade | Revenue ops |
| auditor@demo.com | auditor123 | auditor_externo | Read-only |
| cliente@demo.com | cliente123 | cliente | Customer portal |

## 🌍 **Environment Configuration**

### 🔧 **API Environment (.env)**
```bash
# Database
DATABASE_URL=postgresql://ifrs15_user:ifrs15_password@localhost:5432/ifrs15_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
OIDC_ISSUER_URL=http://localhost:8080/realms/ifrs15
OIDC_CLIENT_ID=ifrs15-api
OIDC_CLIENT_SECRET=your-client-secret-change-in-production

# Application
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:4200,http://localhost:3001

# Observability
LOG_LEVEL=debug
OTLP_ENDPOINT=http://localhost:4318
PROMETHEUS_PORT=9464

# Cache
REDIS_URL=redis://localhost:6379
```

### 🎨 **Frontend Environment (.env)**

This system implements the 5-step IFRS 15 revenue recognition model:

### Step 1: Identify the Contract
- Contract validation and approval workflow
- Multi-party contract support
- Commercial substance verification

### Step 2: Identify Performance Obligations
- Distinct goods/services identification
- Bundle vs. separate obligation analysis
- Performance obligation tracking

### Step 3: Determine Transaction Price
- Fixed and variable consideration
- Significant financing components
- Non-cash consideration handling

### Step 4: Allocate Transaction Price
- Standalone selling price allocation
- Residual approach when applicable
- Contract modification handling

### Step 5: Recognize Revenue
- Point-in-time vs. over-time recognition
- Progress measurement methods
- Contract asset/liability calculation

## 🔒 Security Features

### Authentication & Authorization
- **OIDC/OAuth 2.0** integration with Keycloak
- **JWT** token-based authentication
- **RBAC** with 5 predefined roles
- **Multi-tenant** architecture with RLS

### Database Security
- **Row Level Security (RLS)** policies
- **Tenant isolation** at database level
- **Audit logging** for all operations
- **Data encryption** at rest and in transit

### API Security
- **Rate limiting** and request validation
- **CORS** configuration
- **Security headers** implementation
- **Input sanitization** with Zod schemas

## 📈 Observability

### Logging
- **Structured logging** with Pino
- **Request/response** logging
- **Error tracking** and correlation IDs

### Metrics
- **Prometheus** metrics collection
- **Custom business metrics** for revenue recognition
- **Performance monitoring** dashboards

### Tracing
- **OpenTelemetry** distributed tracing
- **Jaeger** trace visualization
- **Database query** tracing

### Health Checks
- **Liveness** and **readiness** probes
- **Database connectivity** checks
- **External service** health monitoring

## 🧪 Testing Strategy

### Unit Tests
- **Jest** for backend testing
- **Vitest** for frontend testing
- **Domain logic** comprehensive coverage

### Integration Tests
- **API endpoint** testing
- **Database integration** tests
- **Authentication flow** testing

### Contract Tests
- **Pact** consumer-driven contracts
- **API compatibility** verification

### E2E Tests
- **Cypress** end-to-end testing
- **User workflow** validation
- **Cross-browser** compatibility

## 🚢 Deployment

### Development
```bash
# Local development with hot reload
npm run dev
```

### Production
```bash
# Build applications
npm run build

# Start with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | JWT signing secret | Required |
| `OIDC_ISSUER_URL` | Keycloak issuer URL | `http://localhost:8080/realms/ifrs15` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:4200` |
| `LOG_LEVEL` | Logging level | `info` |

## 🤝 Contributing

### Code Style
- **ESLint** and **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Husky** pre-commit hooks for quality checks

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Ensure all checks pass
4. Submit PR with clear description

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

## 📚 Documentation

- **API Documentation**: Available at `/api/docs` when running
- **Architecture Decisions**: See `docs/adr/` directory
- **Database Schema**: See `packages/infra/prisma/schema.prisma`
- **Business Rules**: See `packages/domain/src/` directory

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Reset database
npm run docker:down
npm run docker:up
npm run db:push
```

**Authentication Issues**
```bash
# Check Keycloak status
curl http://localhost:8080/health/ready

# Reset Keycloak realm
docker-compose restart keycloak
```

**Build Issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear NX cache
npx nx reset
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ for IFRS 15 compliance**
