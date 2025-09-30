const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from web app
app.use(express.static(path.join(__dirname, 'apps/web/src')));

// Mock API endpoints for demonstration
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/v1/clients', (req, res) => {
  res.json({
    data: [
      {
        id: 'CLI-001',
        name: 'Empresa ABC Ltda',
        email: 'contato@empresaabc.com.br',
        taxId: '12.345.678/0001-90',
        status: 'active',
        createdAt: '2024-01-15',
        contracts: 2,
        totalValue: 150000
      },
      {
        id: 'CLI-002',
        name: 'Corporação XYZ S.A.',
        email: 'financeiro@corporacaoxyz.com.br',
        taxId: '98.765.432/0001-10',
        status: 'active',
        createdAt: '2024-02-01',
        contracts: 1,
        totalValue: 280000
      }
    ],
    total: 2
  });
});

app.get('/api/v1/contracts', (req, res) => {
  res.json({
    data: [
      {
        id: 'CTR-001',
        customer: 'Empresa ABC Ltda',
        value: 150000,
        status: 'ativo',
        startDate: '2024-01-15',
        performanceObligations: [
          { id: 'PO-001', description: 'Desenvolvimento de Software', allocatedPrice: 100000 },
          { id: 'PO-002', description: 'Treinamento e Suporte', allocatedPrice: 50000 }
        ]
      },
      {
        id: 'CTR-002',
        customer: 'Corporação XYZ S.A.',
        value: 280000,
        status: 'em_andamento',
        startDate: '2024-02-01',
        performanceObligations: [
          { id: 'PO-003', description: 'Consultoria Especializada', allocatedPrice: 180000 },
          { id: 'PO-004', description: 'Implementação', allocatedPrice: 100000 }
        ]
      }
    ],
    total: 2
  });
});

app.get('/api/v1/revenue', (req, res) => {
  res.json({
    data: {
      totalRecognized: 2450000,
      totalPending: 525000,
      performanceObligations: [
        {
          contractId: 'CTR-001',
          description: 'Desenvolvimento de Software',
          allocatedPrice: 100000,
          progress: 75,
          recognizedRevenue: 75000
        },
        {
          contractId: 'CTR-001',
          description: 'Treinamento e Suporte',
          allocatedPrice: 50000,
          progress: 40,
          recognizedRevenue: 20000
        }
      ]
    }
  });
});

// Export endpoints
app.get('/api/v1/export/clients', (req, res) => {
  // Mock CSV export for clients
  const csvData = `Nome,Email,Telefone,Status,Total Contratos,Valor Total
Empresa ABC Ltda,contato@abc.com.br,(11) 99999-9999,ativo,2,R$ 450.000
Corporação XYZ S.A.,admin@xyz.com.br,(21) 88888-8888,ativo,1,R$ 280.000
Tech Solutions Inc,info@techsol.com,(11) 77777-7777,inativo,0,R$ 0`;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="clientes.csv"');
  res.send(csvData);
});

app.get('/api/v1/export/contracts', (req, res) => {
  // Mock CSV export for contracts
  const csvData = `Número,Cliente,Valor,Status,Data Início,Performance Obligations
CTR-001,Empresa ABC Ltda,R$ 150.000,ativo,2024-01-15,2
CTR-002,Corporação XYZ S.A.,R$ 280.000,em_andamento,2024-02-01,2`;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="contratos.csv"');
  res.send(csvData);
});

app.get('/api/v1/export/revenue', (req, res) => {
  // Mock CSV export for revenue
  const csvData = `Contrato,Descrição,Preço Alocado,Progresso,Receita Reconhecida
CTR-001,Desenvolvimento de Software,R$ 100.000,75%,R$ 75.000
CTR-001,Treinamento e Suporte,R$ 50.000,40%,R$ 20.000
CTR-002,Consultoria Especializada,R$ 180.000,90%,R$ 162.000
CTR-002,Implementação,R$ 100.000,60%,R$ 60.000`;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="receitas.csv"');
  res.send(csvData);
});

// Serve the main HTML file for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps/web/src/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 IFRS 15 Development Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`📋 Contracts: http://localhost:${PORT}/contracts`);
  console.log(`💰 Revenue: http://localhost:${PORT}/revenue`);
  console.log(`🔍 API Health: http://localhost:${PORT}/api/v1/health`);
});

module.exports = app;
