# Exemplos de Payload - API de Reconhecimento de Receita IFRS 15

Este documento contém exemplos de payloads para os endpoints de cálculo e alocação de receita.

## POST /contratos/:id/avaliar

### Exemplo 1: Contrato de Software com Licença e Serviços

```json
{
  "transactionPriceInput": {
    "baseTransactionPrice": 250000,
    "variableConsideration": {
      "estimatedAmount": 50000,
      "constraint": "EXPECTED_VALUE",
      "constraintThreshold": 0.2,
      "probabilityAssessment": 0.75
    },
    "financingComponent": {
      "hasSignificantFinancing": false
    },
    "upfrontFees": {
      "amount": 15000,
      "treatmentMethod": "ALLOCATE"
    }
  },
  "performanceObligations": [
    {
      "id": "PO-001",
      "description": "Licença de Software Perpétua",
      "standaloneSellingPrice": 200000,
      "isDistinct": true
    },
    {
      "id": "PO-002", 
      "description": "Serviços de Implementação",
      "standaloneSellingPrice": 80000,
      "isDistinct": true
    },
    {
      "id": "PO-003",
      "description": "Suporte Técnico (12 meses)",
      "standaloneSellingPrice": 40000,
      "isDistinct": true
    }
  ],
  "allocationMethod": "STANDALONE_PRICE",
  "discountAllocation": "PROPORTIONAL",
  "revenueScheduleInputs": [
    {
      "performanceObligationId": "PO-001",
      "recognitionMethod": "POINT_IN_TIME",
      "controlTransferDate": "2024-03-15T00:00:00Z"
    },
    {
      "performanceObligationId": "PO-002",
      "recognitionMethod": "OVER_TIME",
      "progressMeasurement": "COST_TO_COST",
      "contractStartDate": "2024-03-15T00:00:00Z",
      "contractEndDate": "2024-09-15T00:00:00Z",
      "totalEstimatedCosts": 60000,
      "periodicUpdates": [
        {
          "periodEndDate": "2024-04-30T00:00:00Z",
          "actualCostsIncurred": 18000,
          "actualUnitsDelivered": 0,
          "actualValueDelivered": 0
        },
        {
          "periodEndDate": "2024-06-30T00:00:00Z", 
          "actualCostsIncurred": 36000,
          "actualUnitsDelivered": 0,
          "actualValueDelivered": 0
        }
      ]
    },
    {
      "performanceObligationId": "PO-003",
      "recognitionMethod": "OVER_TIME",
      "progressMeasurement": "TIME_ELAPSED",
      "contractStartDate": "2024-03-15T00:00:00Z",
      "contractEndDate": "2025-03-15T00:00:00Z"
    }
  ]
}
```

### Exemplo 2: Contrato de Construção com Método Cost-to-Cost

```json
{
  "transactionPriceInput": {
    "baseTransactionPrice": 5000000,
    "variableConsideration": {
      "estimatedAmount": 300000,
      "constraint": "CONSTRAINED_ESTIMATE",
      "constraintThreshold": 0.3
    },
    "financingComponent": {
      "hasSignificantFinancing": true,
      "effectiveInterestRate": 0.08,
      "paymentTermsMonths": 24
    }
  },
  "performanceObligations": [
    {
      "id": "PO-001",
      "description": "Construção do Edifício Principal",
      "isDistinct": true,
      "estimatedCost": 3500000,
      "marginPercentage": 0.25
    },
    {
      "id": "PO-002",
      "description": "Instalações Especializadas",
      "standaloneSellingPrice": 800000,
      "isDistinct": true
    }
  ],
  "allocationMethod": "AUTO",
  "discountAllocation": "PROPORTIONAL",
  "revenueScheduleInputs": [
    {
      "performanceObligationId": "PO-001",
      "recognitionMethod": "OVER_TIME",
      "progressMeasurement": "COST_TO_COST",
      "contractStartDate": "2024-01-01T00:00:00Z",
      "contractEndDate": "2025-12-31T00:00:00Z",
      "totalEstimatedCosts": 3500000,
      "periodicUpdates": [
        {
          "periodEndDate": "2024-03-31T00:00:00Z",
          "actualCostsIncurred": 525000,
          "actualUnitsDelivered": 0,
          "actualValueDelivered": 0
        },
        {
          "periodEndDate": "2024-06-30T00:00:00Z",
          "actualCostsIncurred": 1225000,
          "actualUnitsDelivered": 0,
          "actualValueDelivered": 0,
          "revisedTotalEstimatedCosts": 3800000
        }
      ]
    },
    {
      "performanceObligationId": "PO-002",
      "recognitionMethod": "OVER_TIME",
      "progressMeasurement": "UNITS_OF_DELIVERY",
      "contractStartDate": "2024-06-01T00:00:00Z",
      "contractEndDate": "2025-06-30T00:00:00Z",
      "totalEstimatedUnits": 50,
      "periodicUpdates": [
        {
          "periodEndDate": "2024-08-31T00:00:00Z",
          "actualCostsIncurred": 0,
          "actualUnitsDelivered": 12,
          "actualValueDelivered": 0
        }
      ]
    }
  ]
}
```

### Exemplo 3: Contrato SaaS com Múltiplas Performance Obligations

```json
{
  "transactionPriceInput": {
    "baseTransactionPrice": 180000,
    "variableConsideration": {
      "estimatedAmount": 20000,
      "constraint": "MOST_LIKELY_AMOUNT",
      "constraintThreshold": 0.1
    }
  },
  "performanceObligations": [
    {
      "id": "PO-001",
      "description": "Setup e Configuração Inicial",
      "standaloneSellingPrice": 25000,
      "isDistinct": true
    },
    {
      "id": "PO-002",
      "description": "Licença SaaS (36 meses)",
      "standaloneSellingPrice": 150000,
      "isDistinct": true
    },
    {
      "id": "PO-003",
      "description": "Treinamento e Consultoria",
      "isDistinct": true,
      "estimatedCost": 15000,
      "marginPercentage": 0.4
    }
  ],
  "allocationMethod": "RESIDUAL",
  "discountAllocation": "SPECIFIC_PO",
  "specificDiscountPO": "PO-002",
  "revenueScheduleInputs": [
    {
      "performanceObligationId": "PO-001",
      "recognitionMethod": "POINT_IN_TIME",
      "controlTransferDate": "2024-02-01T00:00:00Z"
    },
    {
      "performanceObligationId": "PO-002",
      "recognitionMethod": "OVER_TIME",
      "progressMeasurement": "TIME_ELAPSED",
      "contractStartDate": "2024-02-01T00:00:00Z",
      "contractEndDate": "2027-01-31T00:00:00Z"
    },
    {
      "performanceObligationId": "PO-003",
      "recognitionMethod": "OVER_TIME",
      "progressMeasurement": "VALUE_OF_DELIVERY",
      "contractStartDate": "2024-02-15T00:00:00Z",
      "contractEndDate": "2024-05-15T00:00:00Z",
      "totalEstimatedValue": 100000,
      "periodicUpdates": [
        {
          "periodEndDate": "2024-03-31T00:00:00Z",
          "actualCostsIncurred": 0,
          "actualUnitsDelivered": 0,
          "actualValueDelivered": 35000
        }
      ]
    }
  ]
}
```

## POST /contratos/:id/modificar

### Exemplo 1: Adição de Nova Performance Obligation

```json
{
  "modificationDate": "2024-06-15T00:00:00Z",
  "modificationReason": "Cliente solicitou módulo adicional de relatórios",
  "addedPerformanceObligations": [
    {
      "id": "PO-004",
      "description": "Módulo de Relatórios Avançados",
      "standaloneSellingPrice": 45000,
      "isDistinct": true
    }
  ],
  "additionalConsideration": 40000,
  "preferredTreatment": "SEPARATE_CONTRACT"
}
```

### Exemplo 2: Modificação de Escopo com Reestimativa

```json
{
  "modificationDate": "2024-08-01T00:00:00Z",
  "modificationReason": "Expansão do escopo de implementação",
  "modifiedPerformanceObligations": [
    {
      "id": "PO-002",
      "newDescription": "Serviços de Implementação Expandidos",
      "newStandaloneSellingPrice": 120000,
      "scopeChange": "Inclusão de integração com sistemas legados"
    }
  ],
  "additionalConsideration": 35000,
  "newContractEndDate": "2024-12-31T00:00:00Z",
  "preferredTreatment": "MODIFICATION_OF_EXISTING",
  "preferredModificationType": "CUMULATIVE_CATCH_UP"
}
```

### Exemplo 3: Remoção de Performance Obligation

```json
{
  "modificationDate": "2024-05-01T00:00:00Z",
  "modificationReason": "Cliente cancelou módulo de treinamento",
  "removedPerformanceObligationIds": ["PO-003"],
  "additionalConsideration": 0,
  "priceReductions": 25000,
  "preferredTreatment": "MODIFICATION_OF_EXISTING",
  "preferredModificationType": "RETROSPECTIVE"
}
```

## POST /contratos/:id/reprocessar

### Exemplo 1: Atualização de Progresso com Reestimativas

```json
{
  "reason": "Atualização trimestral de progresso e reestimativas",
  "progressUpdates": [
    {
      "performanceObligationId": "PO-001",
      "allocatedAmount": 150000,
      "recognitionMethod": "OVER_TIME",
      "progressMeasurement": "COST_TO_COST",
      "contractStartDate": "2024-01-01T00:00:00Z",
      "contractEndDate": "2024-12-31T00:00:00Z",
      "totalEstimatedCosts": 120000,
      "periodicUpdates": [
        {
          "periodEndDate": "2024-03-31T00:00:00Z",
          "actualCostsIncurred": 36000,
          "actualUnitsDelivered": 0,
          "actualValueDelivered": 0
        },
        {
          "periodEndDate": "2024-06-30T00:00:00Z",
          "actualCostsIncurred": 78000,
          "actualUnitsDelivered": 0,
          "actualValueDelivered": 0,
          "revisedTotalEstimatedCosts": 135000
        },
        {
          "periodEndDate": "2024-09-30T00:00:00Z",
          "actualCostsIncurred": 108000,
          "actualUnitsDelivered": 0,
          "actualValueDelivered": 0,
          "revisedTotalEstimatedCosts": 140000
        }
      ]
    }
  ]
}
```

### Exemplo 2: Reprocessamento com Mudança de Método

```json
{
  "reason": "Mudança de método de cost-to-cost para units of delivery",
  "progressUpdates": [
    {
      "performanceObligationId": "PO-002",
      "allocatedAmount": 200000,
      "recognitionMethod": "OVER_TIME",
      "progressMeasurement": "UNITS_OF_DELIVERY",
      "contractStartDate": "2024-03-01T00:00:00Z",
      "contractEndDate": "2024-11-30T00:00:00Z",
      "totalEstimatedUnits": 100,
      "periodicUpdates": [
        {
          "periodEndDate": "2024-06-30T00:00:00Z",
          "actualCostsIncurred": 0,
          "actualUnitsDelivered": 35,
          "actualValueDelivered": 0
        },
        {
          "periodEndDate": "2024-09-30T00:00:00Z",
          "actualCostsIncurred": 0,
          "actualUnitsDelivered": 68,
          "actualValueDelivered": 0,
          "revisedTotalEstimatedUnits": 110
        }
      ]
    }
  ]
}
```

## Respostas Esperadas

### Resposta do POST /contratos/:id/avaliar

```json
{
  "contractId": "CONTRACT-001",
  "evaluationDate": "2024-10-15T10:30:00Z",
  "transactionPrice": {
    "adjustedTransactionPrice": 302500,
    "adjustments": {
      "variableConsiderationAdjustment": 37500,
      "financingComponentAdjustment": 0,
      "upfrontFeeAdjustment": 15000,
      "modificationAdjustment": 0
    },
    "constraintAnalysis": {
      "unconstrainedAmount": 50000,
      "constrainedAmount": 37500,
      "constraintApplied": true,
      "constraintReason": "Expected value method with 75% probability"
    },
    "breakdown": {
      "baseAmount": 250000,
      "variableAmount": 37500,
      "financingAdjustment": 0,
      "finalAmount": 302500
    }
  },
  "priceAllocation": {
    "totalTransactionPrice": 302500,
    "totalStandaloneSellingPrice": 320000,
    "totalDiscount": 17500,
    "allocationMethod": "STANDALONE_PRICE",
    "allocations": [
      {
        "performanceObligationId": "PO-001",
        "standaloneSellingPrice": 200000,
        "allocatedAmount": 189062.50,
        "allocationPercentage": 0.625,
        "allocationBasis": "STANDALONE_PRICE",
        "adjustments": {
          "discountAdjustment": -10937.50,
          "roundingAdjustment": 0
        }
      },
      {
        "performanceObligationId": "PO-002",
        "standaloneSellingPrice": 80000,
        "allocatedAmount": 75625.00,
        "allocationPercentage": 0.25,
        "allocationBasis": "STANDALONE_PRICE",
        "adjustments": {
          "discountAdjustment": -4375.00,
          "roundingAdjustment": 0
        }
      },
      {
        "performanceObligationId": "PO-003",
        "standaloneSellingPrice": 40000,
        "allocatedAmount": 37812.50,
        "allocationPercentage": 0.125,
        "allocationBasis": "STANDALONE_PRICE",
        "adjustments": {
          "discountAdjustment": -2187.50,
          "roundingAdjustment": 0
        }
      }
    ],
    "validation": {
      "totalAllocated": 302500,
      "allocationVariance": 0,
      "isValid": true,
      "warnings": []
    }
  },
  "revenueSchedules": [
    {
      "performanceObligationId": "PO-001",
      "recognitionMethod": "POINT_IN_TIME",
      "totalAllocatedAmount": 189062.50,
      "schedule": [
        {
          "periodEndDate": "2024-03-15T00:00:00Z",
          "periodStartDate": "2024-03-15T00:00:00Z",
          "progressPercentage": 100,
          "revenueAmount": 189062.50,
          "cumulativeRevenue": 189062.50,
          "remainingRevenue": 0,
          "progressBasis": "CONTROL_TRANSFER"
        }
      ],
      "summary": {
        "totalRecognized": 189062.50,
        "totalRemaining": 0,
        "completionPercentage": 100,
        "lastUpdateDate": "2024-03-15T00:00:00Z"
      },
      "reestimateHistory": []
    }
  ],
  "summary": {
    "totalContractValue": 302500,
    "totalAllocated": 302500,
    "performanceObligationsCount": 3,
    "allocationValid": true
  }
}
```

### Resposta do POST /contratos/:id/modificar

```json
{
  "success": true,
  "modificationResult": {
    "modificationId": "MOD-CONTRACT-001-1729000000000",
    "originalContractId": "CONTRACT-001",
    "treatment": "SEPARATE_CONTRACT",
    "modificationType": "PROSPECTIVE",
    "originalTransactionPrice": 302500,
    "newTransactionPrice": 40000,
    "priceAdjustment": 40000,
    "originalAllocations": [],
    "newAllocations": [
      {
        "poId": "PO-004",
        "amount": 40000
      }
    ],
    "allocationAdjustments": [
      {
        "poId": "PO-004",
        "adjustment": 40000
      }
    ],
    "revenueScheduleAdjustments": [
      {
        "performanceObligationId": "PO-004",
        "cumulativeCatchUpAdjustment": 0,
        "futurePeriodsAdjustment": 40000,
        "effectiveDate": "2024-06-15T00:00:00Z"
      }
    ],
    "accountingEntries": [
      {
        "date": "2024-06-15T00:00:00Z",
        "description": "Contract modification - additional consideration",
        "debitAccount": "Contract Asset",
        "creditAccount": "Deferred Revenue",
        "amount": 40000
      }
    ]
  },
  "processedAt": "2024-10-15T10:45:00Z"
}
```

## Códigos de Status HTTP

- **200 OK**: Operação realizada com sucesso
- **400 Bad Request**: Dados de entrada inválidos
- **401 Unauthorized**: Token de autenticação inválido ou ausente
- **403 Forbidden**: Usuário não possui permissão para a operação
- **404 Not Found**: Contrato não encontrado
- **500 Internal Server Error**: Erro interno do servidor

## Notas Importantes

1. **Autenticação**: Todos os endpoints requerem autenticação via JWT Bearer token
2. **Permissões**: Verificar roles necessárias para cada endpoint
3. **Validação**: Payloads são validados conforme regras IFRS 15
4. **Datas**: Usar formato ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
5. **Valores Monetários**: Em centavos ou menor unidade da moeda
6. **IDs**: Usar identificadores únicos e consistentes
