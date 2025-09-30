# 📋 Cenários de Exemplo - Módulo DAC (Deferred Acquisition Costs)

## 🎯 **Cenário 1: Comissão de Vendas - Software Enterprise**

### **Contexto:**
Empresa de software fecha contrato de R$ 500.000 para licenciamento e implementação. Comissão de vendas de R$ 50.000 paga ao representante.

### **Payload de Registro:**
```json
{
  "contractId": "CTR-SOFT-001",
  "performanceObligationId": "PO-LICENSE-001",
  "costType": "SALES_COMMISSION",
  "amount": 50000,
  "description": "Comissão de vendas para contrato de software enterprise",
  "incurredDate": "2024-01-15T00:00:00Z",
  "isIncremental": true,
  "isRecoverable": true,
  "amortizationMethod": "PERFORMANCE_OBLIGATION_PATTERN",
  "amortizationPeriodMonths": 36,
  "expectedBenefitPeriod": "2027-01-15T00:00:00Z",
  "supportingDocuments": [
    "commission-agreement-001.pdf",
    "sales-contract-CTR-SOFT-001.pdf"
  ]
}
```

### **Resultado Esperado:**
- **DAC ID:** `DAC-CTR-SOFT-001-{timestamp}`
- **Amortização:** R$ 1.389/mês por 36 meses
- **Lançamentos Contábeis:**
  - **Débito:** Conta 1350 (DAC) - R$ 50.000
  - **Crédito:** Conta 2100 (Contas a Pagar) - R$ 50.000

---

## 🎯 **Cenário 2: Taxa de Corretagem - Contrato Construção**

### **Contexto:**
Construtora obtém contrato de R$ 2.000.000 através de corretor. Taxa de corretagem de R$ 80.000.

### **Payload de Registro:**
```json
{
  "contractId": "CTR-CONST-002",
  "performanceObligationId": "PO-CONSTRUCTION-001",
  "costType": "BROKER_FEE",
  "amount": 80000,
  "description": "Taxa de corretagem para contrato de construção residencial",
  "incurredDate": "2024-02-01T00:00:00Z",
  "isIncremental": true,
  "isRecoverable": true,
  "amortizationMethod": "CONTRACT_PATTERN",
  "amortizationPeriodMonths": 24,
  "expectedBenefitPeriod": "2026-02-01T00:00:00Z",
  "supportingDocuments": [
    "broker-agreement-002.pdf",
    "construction-contract-002.pdf"
  ]
}
```

### **Cronograma de Amortização (GET /dac/{id}/agenda):**
```json
{
  "dacId": "DAC-CTR-CONST-002-{timestamp}",
  "totalOriginalAmount": 80000,
  "totalAmortized": 20000,
  "remainingBalance": 60000,
  "amortizationSchedule": [
    {
      "period": "2024-03-01T00:00:00Z",
      "beginningBalance": 80000,
      "amortizationAmount": 3333,
      "endingBalance": 76667,
      "cumulativeAmortization": 3333
    },
    {
      "period": "2024-04-01T00:00:00Z",
      "beginningBalance": 76667,
      "amortizationAmount": 3333,
      "endingBalance": 73334,
      "cumulativeAmortization": 6666
    }
  ],
  "nextAmortizationDate": "2024-05-01T00:00:00Z"
}
```

---

## 🎯 **Cenário 3: Teste de Impairment - Contrato em Dificuldades**

### **Contexto:**
Contrato de consultoria com DAC de R$ 75.000. Cliente enfrenta dificuldades financeiras, reduzindo consideração esperada.

### **Payload de Teste de Impairment:**
```json
{
  "testDate": "2024-06-30T00:00:00Z",
  "remainingConsideration": 120000,
  "directCosts": 40000,
  "estimatedCostsToComplete": 90000,
  "contractModifications": {
    "additionalConsideration": -20000,
    "additionalCosts": 5000
  }
}
```

### **Resultado do Teste (POST /dac/{id}/teste-impairment):**
```json
{
  "success": true,
  "data": {
    "dacId": "DAC-CTR-CONS-003-{timestamp}",
    "testDate": "2024-06-30T00:00:00Z",
    "carryingAmount": 75000,
    "recoverableAmount": -35000,
    "impairmentLoss": 75000,
    "isImpaired": true,
    "impairmentCalculation": {
      "remainingConsideration": 120000,
      "directCosts": 40000,
      "estimatedCostsToComplete": 90000,
      "netRecoverableAmount": -35000
    },
    "accountingEntries": [
      {
        "account": "6300",
        "debit": 75000,
        "description": "DAC impairment loss recognition"
      },
      {
        "account": "1350",
        "credit": 75000,
        "description": "DAC impairment write-down"
      }
    ],
    "recommendations": [
      "Immediate impairment loss recognition required",
      "Review contract terms and performance to understand impairment drivers",
      "Consider impact on future DAC recognition policies"
    ]
  },
  "summary": {
    "impairmentRequired": true,
    "impairmentAmount": 75000,
    "recoverabilityRatio": -0.47
  }
}
```

---

## 🎯 **Cenário 4: Custos Legais - Contrato SaaS**

### **Contexto:**
Startup SaaS incorre em custos legais de R$ 25.000 para negociar contrato enterprise de 3 anos.

### **Payload de Registro:**
```json
{
  "contractId": "CTR-SAAS-004",
  "performanceObligationId": "PO-SAAS-SUBSCRIPTION",
  "costType": "LEGAL_FEES",
  "amount": 25000,
  "description": "Custos legais para negociação de contrato SaaS enterprise",
  "incurredDate": "2024-03-01T00:00:00Z",
  "isIncremental": true,
  "isRecoverable": true,
  "amortizationMethod": "STRAIGHT_LINE",
  "amortizationPeriodMonths": 36,
  "expectedBenefitPeriod": "2027-03-01T00:00:00Z",
  "supportingDocuments": [
    "legal-invoice-004.pdf",
    "saas-contract-004.pdf"
  ]
}
```

### **Status do DAC (GET /dac/{id}/status):**
```json
{
  "dacId": "DAC-CTR-SAAS-004-{timestamp}",
  "status": "active",
  "currentBalance": 18750,
  "originalAmount": 25000,
  "amortizedToDate": 6250,
  "amortizationProgress": 25,
  "nextAmortizationDate": "2024-07-01T00:00:00Z",
  "lastImpairmentTest": "2024-06-01T00:00:00Z",
  "impairmentStatus": "no_impairment_required"
}
```

---

## 🎯 **Cenário 5: Due Diligence - Aquisição de Cliente**

### **Contexto:**
Empresa de serviços financeiros paga R$ 100.000 em due diligence para adquirir carteira de clientes.

### **Payload de Registro:**
```json
{
  "contractId": "CTR-FINSERV-005",
  "costType": "DUE_DILIGENCE",
  "amount": 100000,
  "description": "Custos de due diligence para aquisição de carteira de clientes",
  "incurredDate": "2024-04-01T00:00:00Z",
  "isIncremental": true,
  "isRecoverable": true,
  "amortizationMethod": "REVENUE_PATTERN",
  "amortizationPeriodMonths": 60,
  "expectedBenefitPeriod": "2029-04-01T00:00:00Z",
  "supportingDocuments": [
    "due-diligence-report-005.pdf",
    "client-acquisition-agreement-005.pdf"
  ]
}
```

### **Reestimativa de Amortização (POST /dac/{id}/reestimate):**
```json
{
  "reason": "Modificação contratual - extensão do período de benefício",
  "contractModification": {
    "newEndDate": "2030-04-01T00:00:00Z",
    "additionalConsideration": 50000
  },
  "effectiveDate": "2024-07-01T00:00:00Z"
}
```

---

## 📊 **Resumo dos Cenários**

| Cenário | Tipo de Custo | Valor DAC | Período | Método Amortização | Status |
|---------|---------------|-----------|---------|-------------------|--------|
| Software Enterprise | Comissão Vendas | R$ 50.000 | 36 meses | Performance Obligation | Ativo |
| Construção | Taxa Corretagem | R$ 80.000 | 24 meses | Contract Pattern | Ativo |
| Consultoria | Comissão Vendas | R$ 75.000 | - | - | **Impaired** |
| SaaS | Custos Legais | R$ 25.000 | 36 meses | Straight Line | Ativo |
| Serviços Financeiros | Due Diligence | R$ 100.000 | 60 meses | Revenue Pattern | Reestimado |

---

## 🔧 **Endpoints Implementados**

### **1. Registro de DAC**
```
POST /dac
```
- Registra custos incrementais elegíveis
- Calcula cronograma de amortização
- Gera lançamentos contábeis iniciais

### **2. Cronograma de Amortização**
```
GET /dac/{id}/agenda
```
- Retorna cronograma detalhado
- Mostra saldos e próximas amortizações
- Inclui lançamentos contábeis periódicos

### **3. Teste de Impairment**
```
POST /dac/{id}/teste-impairment
```
- Compara valor contábil vs. recuperável
- Identifica necessidade de impairment
- Gera lançamentos de perda por impairment

### **4. Status do DAC**
```
GET /dac/{id}/status
```
- Informações consolidadas do DAC
- Progresso de amortização
- Status de impairment

### **5. Reestimativa**
```
POST /dac/{id}/reestimate
```
- Ajusta cronograma por mudanças contratuais
- Calcula catch-up adjustments
- Atualiza padrão de amortização

---

## ✅ **Validações Implementadas**

### **Custos Elegíveis:**
- ✅ Custos incrementais de obtenção
- ✅ Diretamente atribuíveis ao contrato
- ✅ Não teriam sido incorridos sem o contrato
- ✅ Recuperáveis através do contrato

### **Métodos de Amortização:**
- ✅ **Straight Line** - Linear ao longo do período
- ✅ **Performance Obligation Pattern** - Segue transferência de controle
- ✅ **Contract Pattern** - Baseado no padrão do contrato
- ✅ **Revenue Pattern** - Proporcional ao reconhecimento de receita

### **Teste de Recuperabilidade:**
- ✅ Consideração remanescente líquida
- ✅ Custos diretos e estimados
- ✅ Modificações contratuais
- ✅ Margem de segurança

---

## 🎉 **Módulo DAC: 100% IMPLEMENTADO**

**Funcionalidades Completas:**
- ✅ Registro de custos incrementais
- ✅ Amortização sistemática
- ✅ Teste de impairment
- ✅ Geração de lançamentos contábeis
- ✅ Endpoints REST completos
- ✅ Testes unitários abrangentes
- ✅ Cenários de exemplo detalhados

**Pronto para integração com GL e uso em produção!**
