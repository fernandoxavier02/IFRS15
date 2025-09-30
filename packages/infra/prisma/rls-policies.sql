-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR IFRS 15 MULTI-TENANT SCHEMA
-- Garante isolamento completo de dados por tenant_id
-- ============================================================================

-- Habilitar RLS em todas as tabelas principais
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clauses ENABLE ROW LEVEL SECURITY;

-- Performance Obligations & Promises
ALTER TABLE performance_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;

-- Transaction Price Components
ALTER TABLE transaction_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_considerations ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_consideration_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE significant_financing_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE principal_agent_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_cash_considerations ENABLE ROW LEVEL SECURITY;
ALTER TABLE foreign_currency_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_refund_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE software_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_refundable_upfront_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_arrangements ENABLE ROW LEVEL SECURITY;

-- Price Allocation
ALTER TABLE standalone_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_allocations ENABLE ROW LEVEL SECURITY;

-- Revenue Recognition
ALTER TABLE revenue_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_methods ENABLE ROW LEVEL SECURITY;

-- Balance Sheet Items
ALTER TABLE contract_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimated_provisions ENABLE ROW LEVEL SECURITY;

-- Cost Tracking
ALTER TABLE incremental_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE amortization_entries ENABLE ROW LEVEL SECURITY;

-- Billing & Invoicing
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Audit Trail
ALTER TABLE audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNÇÃO PARA OBTER TENANT_ID DO CONTEXTO DA SESSÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.current_tenant_id', true)::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- POLÍTICAS RLS PARA TABELAS PRINCIPAIS
-- ============================================================================

-- Tenants: Usuários só podem ver seu próprio tenant
CREATE POLICY tenant_isolation ON tenants
    FOR ALL
    USING (id = get_current_tenant_id());

-- Users: Isolamento por tenant_id
CREATE POLICY user_tenant_isolation ON users
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

-- Customers: Isolamento por tenant_id
CREATE POLICY customer_tenant_isolation ON customers
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

-- Contracts: Isolamento por tenant_id
CREATE POLICY contract_tenant_isolation ON contracts
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

-- Contract Modifications: Isolamento por tenant_id
CREATE POLICY contract_modification_tenant_isolation ON contract_modifications
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

-- Clauses: Isolamento via contract
CREATE POLICY clause_tenant_isolation ON clauses
    FOR ALL
    USING (
        contract_id IN (
            SELECT id FROM contracts WHERE tenant_id = get_current_tenant_id()
        )
    );

-- ============================================================================
-- POLÍTICAS PARA PERFORMANCE OBLIGATIONS & PROMISES
-- ============================================================================

CREATE POLICY performance_obligation_tenant_isolation ON performance_obligations
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY promise_tenant_isolation ON promises
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- POLÍTICAS PARA TRANSACTION PRICE COMPONENTS
-- ============================================================================

CREATE POLICY transaction_price_tenant_isolation ON transaction_prices
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY variable_consideration_tenant_isolation ON variable_considerations
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY variable_consideration_constraint_tenant_isolation ON variable_consideration_constraints
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY significant_financing_component_tenant_isolation ON significant_financing_components
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY material_right_tenant_isolation ON material_rights
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY warranty_tenant_isolation ON warranties
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY principal_agent_analysis_tenant_isolation ON principal_agent_analyses
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY non_cash_consideration_tenant_isolation ON non_cash_considerations
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY foreign_currency_transaction_tenant_isolation ON foreign_currency_transactions
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY return_refund_option_tenant_isolation ON return_refund_options
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY software_license_tenant_isolation ON software_licenses
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY non_refundable_upfront_fee_tenant_isolation ON non_refundable_upfront_fees
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY consignment_arrangement_tenant_isolation ON consignment_arrangements
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- POLÍTICAS PARA PRICE ALLOCATION
-- ============================================================================

CREATE POLICY standalone_price_tenant_isolation ON standalone_prices
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY price_allocation_tenant_isolation ON price_allocations
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- POLÍTICAS PARA REVENUE RECOGNITION
-- ============================================================================

CREATE POLICY revenue_schedule_tenant_isolation ON revenue_schedules
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY progress_method_tenant_isolation ON progress_methods
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- POLÍTICAS PARA BALANCE SHEET ITEMS
-- ============================================================================

CREATE POLICY contract_asset_tenant_isolation ON contract_assets
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY contract_liability_tenant_isolation ON contract_liabilities
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY refund_liability_tenant_isolation ON refund_liabilities
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY estimated_provision_tenant_isolation ON estimated_provisions
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- POLÍTICAS PARA COST TRACKING
-- ============================================================================

CREATE POLICY incremental_cost_tenant_isolation ON incremental_costs
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY amortization_entry_tenant_isolation ON amortization_entries
    FOR ALL
    USING (
        incremental_cost_id IN (
            SELECT id FROM incremental_costs WHERE tenant_id = get_current_tenant_id()
        )
    );

-- ============================================================================
-- POLÍTICAS PARA BILLING & INVOICING
-- ============================================================================

CREATE POLICY invoice_tenant_isolation ON invoices
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY billing_schedule_tenant_isolation ON billing_schedules
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY receipt_tenant_isolation ON receipts
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- POLÍTICAS PARA AUDIT TRAIL
-- ============================================================================

CREATE POLICY audit_trail_tenant_isolation ON audit_trails
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY policy_snapshot_tenant_isolation ON policy_snapshots
    FOR ALL
    USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices em tenant_id para todas as tabelas principais
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_modifications_tenant_id ON contract_modifications(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_obligations_tenant_id ON performance_obligations(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_promises_tenant_id ON promises(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_prices_tenant_id ON transaction_prices(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variable_considerations_tenant_id ON variable_considerations(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variable_consideration_constraints_tenant_id ON variable_consideration_constraints(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_standalone_prices_tenant_id ON standalone_prices(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_price_allocations_tenant_id ON price_allocations(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_schedules_tenant_id ON revenue_schedules(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_methods_tenant_id ON progress_methods(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_assets_tenant_id ON contract_assets(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_liabilities_tenant_id ON contract_liabilities(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incremental_costs_tenant_id ON incremental_costs(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_schedules_tenant_id ON billing_schedules(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_tenant_id ON receipts(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_trails_tenant_id ON audit_trails(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policy_snapshots_tenant_id ON policy_snapshots(tenant_id);

-- Índices compostos para queries frequentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_tenant_status ON contracts(tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_tenant_customer ON contracts(tenant_id, customer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_schedules_tenant_period ON revenue_schedules(tenant_id, period);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status);

-- ============================================================================
-- FUNÇÕES AUXILIARES PARA CONFIGURAR TENANT CONTEXT
-- ============================================================================

-- Função para definir o tenant atual na sessão
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_uuid UUID) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar o contexto do tenant
CREATE OR REPLACE FUNCTION clear_current_tenant() RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION get_current_tenant_id() IS 'Obtém o tenant_id do contexto da sessão atual para RLS';
COMMENT ON FUNCTION set_current_tenant(UUID) IS 'Define o tenant ativo para a sessão atual';
COMMENT ON FUNCTION clear_current_tenant() IS 'Limpa o contexto do tenant da sessão atual';

-- Comentários nas políticas principais
COMMENT ON POLICY tenant_isolation ON tenants IS 'Isolamento de tenants - usuários só veem seu próprio tenant';
COMMENT ON POLICY user_tenant_isolation ON users IS 'Isolamento de usuários por tenant_id';
COMMENT ON POLICY contract_tenant_isolation ON contracts IS 'Isolamento de contratos por tenant_id';
COMMENT ON POLICY revenue_schedule_tenant_isolation ON revenue_schedules IS 'Isolamento de schedules de receita por tenant_id';

-- ============================================================================
-- GRANTS E PERMISSÕES
-- ============================================================================

-- Conceder permissões para roles da aplicação
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION set_current_tenant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_current_tenant() TO authenticated;

-- Exemplo de uso das funções RLS:
-- SELECT set_current_tenant('tenant-uuid-here');
-- SELECT * FROM contracts; -- Retornará apenas contratos do tenant ativo
-- SELECT clear_current_tenant();
