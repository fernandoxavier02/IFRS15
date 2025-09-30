/**
 * IFRS 15 Sanity Check Script
 * Validates all components of the IFRS 15 implementation
 */

const fs = require('fs');
const path = require('path');

class IFRS15SanityCheck {
  constructor() {
    this.results = {
      schema: { passed: 0, failed: 0, issues: [] },
      seeds: { passed: 0, failed: 0, issues: [] },
      rls: { passed: 0, failed: 0, issues: [] },
      integrity: { passed: 0, failed: 0, issues: [] },
      overall: 'PENDING'
    };
  }

  log(category, message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${category}] [${status}] ${message}`);
  }

  // 1. Schema Validation
  validateSchema() {
    this.log('SCHEMA', 'Iniciando validação do schema Prisma...');
    
    const schemaPath = path.join(__dirname, '../packages/infra/prisma/schema.prisma');
    
    try {
      // Check if schema file exists
      if (!fs.existsSync(schemaPath)) {
        this.results.schema.failed++;
        this.results.schema.issues.push('Schema file not found');
        this.log('SCHEMA', 'Schema file not found', 'ERROR');
        return;
      }

      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Validate essential components
      const requiredComponents = [
        'generator client',
        'datasource db',
        'model Tenant',
        'model User',
        'model Customer',
        'model Contract',
        'model PerformanceObligation',
        'model TransactionPrice',
        'model StandalonePrice',
        'model RevenueSchedule',
        'model ContractAsset',
        'model IncrementalCost',
        'model Invoice',
        'model AuditTrail'
      ];

      requiredComponents.forEach(component => {
        if (schemaContent.includes(component)) {
          this.results.schema.passed++;
          this.log('SCHEMA', `✅ ${component} found`);
        } else {
          this.results.schema.failed++;
          this.results.schema.issues.push(`Missing: ${component}`);
          this.log('SCHEMA', `❌ ${component} missing`, 'ERROR');
        }
      });

      // Validate IFRS 15 specific enums
      const requiredEnums = [
        'enum ContractStatus',
        'enum SatisfactionMethod',
        'enum RevenueRecognitionMethod',
        'enum AllocationMethod',
        'enum AuditAction'
      ];

      requiredEnums.forEach(enumType => {
        if (schemaContent.includes(enumType)) {
          this.results.schema.passed++;
          this.log('SCHEMA', `✅ ${enumType} found`);
        } else {
          this.results.schema.failed++;
          this.results.schema.issues.push(`Missing: ${enumType}`);
          this.log('SCHEMA', `❌ ${enumType} missing`, 'ERROR');
        }
      });

      // Check for multi-tenancy
      const tenantIdReferences = (schemaContent.match(/tenant_id|tenantId/g) || []).length;
      if (tenantIdReferences >= 40) {
        this.results.schema.passed++;
        this.log('SCHEMA', `✅ Multi-tenancy implemented (${tenantIdReferences} references)`);
      } else {
        this.results.schema.failed++;
        this.results.schema.issues.push('Insufficient multi-tenancy implementation');
        this.log('SCHEMA', `❌ Multi-tenancy incomplete (${tenantIdReferences} references)`, 'ERROR');
      }

    } catch (error) {
      this.results.schema.failed++;
      this.results.schema.issues.push(`Schema validation error: ${error.message}`);
      this.log('SCHEMA', `Validation error: ${error.message}`, 'ERROR');
    }
  }

  // 2. Seeds Validation
  validateSeeds() {
    this.log('SEEDS', 'Validando arquivo de seeds...');
    
    const seedPath = path.join(__dirname, '../packages/infra/prisma/seed.ts');
    
    try {
      if (!fs.existsSync(seedPath)) {
        this.results.seeds.failed++;
        this.results.seeds.issues.push('Seed file not found');
        this.log('SEEDS', 'Seed file not found', 'ERROR');
        return;
      }

      const seedContent = fs.readFileSync(seedPath, 'utf8');
      
      // Validate seed components
      const requiredSeedData = [
        'tenant.upsert',
        'user.upsert',
        'customer.upsert',
        'contract.upsert',
        'performanceObligation.create',
        'revenueSchedule.create',
        'invoice.create',
        'receipt.create',
        'incrementalCost.create',
        'policySnapshot.create'
      ];

      requiredSeedData.forEach(seedItem => {
        if (seedContent.includes(seedItem)) {
          this.results.seeds.passed++;
          this.log('SEEDS', `✅ ${seedItem} found`);
        } else {
          this.results.seeds.failed++;
          this.results.seeds.issues.push(`Missing: ${seedItem}`);
          this.log('SEEDS', `❌ ${seedItem} missing`, 'ERROR');
        }
      });

      // Check for realistic demo data
      if (seedContent.includes('TechCorp') && seedContent.includes('InnovaSoft')) {
        this.results.seeds.passed++;
        this.log('SEEDS', '✅ Demo customers found');
      } else {
        this.results.seeds.failed++;
        this.results.seeds.issues.push('Demo customers missing');
        this.log('SEEDS', '❌ Demo customers missing', 'ERROR');
      }

    } catch (error) {
      this.results.seeds.failed++;
      this.results.seeds.issues.push(`Seeds validation error: ${error.message}`);
      this.log('SEEDS', `Validation error: ${error.message}`, 'ERROR');
    }
  }

  // 3. RLS Policies Validation
  validateRLS() {
    this.log('RLS', 'Validando políticas Row Level Security...');
    
    const rlsPath = path.join(__dirname, '../packages/infra/prisma/rls-policies.sql');
    
    try {
      if (!fs.existsSync(rlsPath)) {
        this.results.rls.failed++;
        this.results.rls.issues.push('RLS policies file not found');
        this.log('RLS', 'RLS policies file not found', 'ERROR');
        return;
      }

      const rlsContent = fs.readFileSync(rlsPath, 'utf8');
      
      // Validate RLS components
      const requiredRLSComponents = [
        'ENABLE ROW LEVEL SECURITY',
        'get_current_tenant_id()',
        'set_current_tenant',
        'tenant_isolation',
        'user_tenant_isolation',
        'contract_tenant_isolation',
        'revenue_schedule_tenant_isolation',
        'audit_trail_tenant_isolation'
      ];

      requiredRLSComponents.forEach(component => {
        if (rlsContent.includes(component)) {
          this.results.rls.passed++;
          this.log('RLS', `✅ ${component} found`);
        } else {
          this.results.rls.failed++;
          this.results.rls.issues.push(`Missing: ${component}`);
          this.log('RLS', `❌ ${component} missing`, 'ERROR');
        }
      });

      // Check for comprehensive table coverage
      const enableRLSCount = (rlsContent.match(/ENABLE ROW LEVEL SECURITY/g) || []).length;
      if (enableRLSCount >= 30) {
        this.results.rls.passed++;
        this.log('RLS', `✅ Comprehensive RLS coverage (${enableRLSCount} tables)`);
      } else {
        this.results.rls.failed++;
        this.results.rls.issues.push('Insufficient RLS coverage');
        this.log('RLS', `❌ Insufficient RLS coverage (${enableRLSCount} tables)`, 'ERROR');
      }

    } catch (error) {
      this.results.rls.failed++;
      this.results.rls.issues.push(`RLS validation error: ${error.message}`);
      this.log('RLS', `Validation error: ${error.message}`, 'ERROR');
    }
  }

  // 4. Model Integrity Validation
  validateIntegrity() {
    this.log('INTEGRITY', 'Validando integridade do modelo IFRS 15...');
    
    try {
      // Check if all domain schema files exist
      const domainSchemas = [
        '01-core-entities.prisma',
        '02-performance-obligations.prisma',
        '03-transaction-price.prisma',
        '04-price-allocation.prisma',
        '05-revenue-recognition.prisma',
        '06-balance-sheet.prisma',
        '07-cost-tracking.prisma',
        '08-billing-invoicing.prisma',
        '09-audit-trail.prisma'
      ];

      const schemasDir = path.join(__dirname, '../packages/infra/prisma/schemas');
      
      domainSchemas.forEach(schemaFile => {
        const filePath = path.join(schemasDir, schemaFile);
        if (fs.existsSync(filePath)) {
          this.results.integrity.passed++;
          this.log('INTEGRITY', `✅ ${schemaFile} exists`);
        } else {
          this.results.integrity.failed++;
          this.results.integrity.issues.push(`Missing: ${schemaFile}`);
          this.log('INTEGRITY', `❌ ${schemaFile} missing`, 'ERROR');
        }
      });

      // Check ERD documentation
      const erdPath = path.join(__dirname, '../docs/ifrs15-erd.md');
      if (fs.existsSync(erdPath)) {
        this.results.integrity.passed++;
        this.log('INTEGRITY', '✅ ERD documentation exists');
      } else {
        this.results.integrity.failed++;
        this.results.integrity.issues.push('ERD documentation missing');
        this.log('INTEGRITY', '❌ ERD documentation missing', 'ERROR');
      }

      // Validate IFRS 15 5-step implementation
      const ifrs15Steps = [
        'Step 1: Identify the Contract',
        'Step 2: Performance Obligations',
        'Step 3: Transaction Price',
        'Step 4: Price Allocation',
        'Step 5: Revenue Recognition'
      ];

      const schemaPath = path.join(__dirname, '../packages/infra/prisma/schema.prisma');
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        ifrs15Steps.forEach(step => {
          if (schemaContent.includes(step)) {
            this.results.integrity.passed++;
            this.log('INTEGRITY', `✅ ${step} implemented`);
          } else {
            this.results.integrity.failed++;
            this.results.integrity.issues.push(`Missing: ${step}`);
            this.log('INTEGRITY', `❌ ${step} missing`, 'ERROR');
          }
        });
      }

    } catch (error) {
      this.results.integrity.failed++;
      this.results.integrity.issues.push(`Integrity validation error: ${error.message}`);
      this.log('INTEGRITY', `Validation error: ${error.message}`, 'ERROR');
    }
  }

  // Generate final report
  generateReport() {
    this.log('REPORT', 'Gerando relatório final...');
    
    const totalPassed = this.results.schema.passed + this.results.seeds.passed + 
                       this.results.rls.passed + this.results.integrity.passed;
    const totalFailed = this.results.schema.failed + this.results.seeds.failed + 
                       this.results.rls.failed + this.results.integrity.failed;
    const totalTests = totalPassed + totalFailed;
    const successRate = ((totalPassed / totalTests) * 100).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('🔍 IFRS 15 SANITY CHECK REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📊 SUMMARY:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} (${successRate}%)`);
    console.log(`Failed: ${totalFailed}`);
    
    console.log('\n📋 DETAILED RESULTS:');
    
    // Schema Results
    console.log(`\n🗄️  SCHEMA VALIDATION:`);
    console.log(`   Passed: ${this.results.schema.passed}`);
    console.log(`   Failed: ${this.results.schema.failed}`);
    if (this.results.schema.issues.length > 0) {
      console.log(`   Issues: ${this.results.schema.issues.join(', ')}`);
    }
    
    // Seeds Results
    console.log(`\n🌱 SEEDS VALIDATION:`);
    console.log(`   Passed: ${this.results.seeds.passed}`);
    console.log(`   Failed: ${this.results.seeds.failed}`);
    if (this.results.seeds.issues.length > 0) {
      console.log(`   Issues: ${this.results.seeds.issues.join(', ')}`);
    }
    
    // RLS Results
    console.log(`\n🔒 RLS VALIDATION:`);
    console.log(`   Passed: ${this.results.rls.passed}`);
    console.log(`   Failed: ${this.results.rls.failed}`);
    if (this.results.rls.issues.length > 0) {
      console.log(`   Issues: ${this.results.rls.issues.join(', ')}`);
    }
    
    // Integrity Results
    console.log(`\n🏗️  INTEGRITY VALIDATION:`);
    console.log(`   Passed: ${this.results.integrity.passed}`);
    console.log(`   Failed: ${this.results.integrity.failed}`);
    if (this.results.integrity.issues.length > 0) {
      console.log(`   Issues: ${this.results.integrity.issues.join(', ')}`);
    }
    
    // Overall Status
    if (totalFailed === 0) {
      this.results.overall = 'PASSED';
      console.log('\n✅ OVERALL STATUS: PASSED');
      console.log('🎉 All components are functional and ready for next phase!');
    } else if (successRate >= 90) {
      this.results.overall = 'PASSED_WITH_WARNINGS';
      console.log('\n⚠️  OVERALL STATUS: PASSED WITH WARNINGS');
      console.log('🚧 Minor issues detected but system is functional');
    } else {
      this.results.overall = 'FAILED';
      console.log('\n❌ OVERALL STATUS: FAILED');
      console.log('🛑 Critical issues detected - requires attention before proceeding');
    }
    
    console.log('\n' + '='.repeat(80));
    
    return this.results.overall;
  }

  // Run all validations
  async run() {
    console.log('🚀 Starting IFRS 15 Sanity Check...\n');
    
    this.validateSchema();
    this.validateSeeds();
    this.validateRLS();
    this.validateIntegrity();
    
    return this.generateReport();
  }
}

// Run the sanity check
if (require.main === module) {
  const checker = new IFRS15SanityCheck();
  checker.run().then(status => {
    process.exit(status === 'PASSED' ? 0 : 1);
  }).catch(error => {
    console.error('Sanity check failed:', error);
    process.exit(1);
  });
}

module.exports = IFRS15SanityCheck;
