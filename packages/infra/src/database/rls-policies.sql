-- Row Level Security Policies for IFRS 15 Multi-tenant Application

-- Helper function to get current tenant ID from session
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants table policies
DROP POLICY IF EXISTS tenant_isolation ON tenants;
CREATE POLICY tenant_isolation ON tenants
  FOR ALL
  TO PUBLIC
  USING (id = current_tenant_id());

-- Users table policies
DROP POLICY IF EXISTS user_tenant_isolation ON users;
CREATE POLICY user_tenant_isolation ON users
  FOR ALL
  TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- Customers table policies
DROP POLICY IF EXISTS customer_tenant_isolation ON customers;
CREATE POLICY customer_tenant_isolation ON customers
  FOR ALL
  TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- Contracts table policies
DROP POLICY IF EXISTS contract_tenant_isolation ON contracts;
CREATE POLICY contract_tenant_isolation ON contracts
  FOR ALL
  TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- Performance obligations table policies (inherit from contract)
DROP POLICY IF EXISTS performance_obligation_tenant_isolation ON performance_obligations;
CREATE POLICY performance_obligation_tenant_isolation ON performance_obligations
  FOR ALL
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = performance_obligations.contract_id 
      AND contracts.tenant_id = current_tenant_id()
    )
  );

-- Revenue recognitions table policies
DROP POLICY IF EXISTS revenue_recognition_tenant_isolation ON revenue_recognitions;
CREATE POLICY revenue_recognition_tenant_isolation ON revenue_recognitions
  FOR ALL
  TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- Audit logs table policies
DROP POLICY IF EXISTS audit_log_tenant_isolation ON audit_logs;
CREATE POLICY audit_log_tenant_isolation ON audit_logs
  FOR ALL
  TO PUBLIC
  USING (tenant_id = current_tenant_id());

-- Additional security: Prevent cross-tenant data access through foreign keys
-- This trigger ensures that referenced entities belong to the same tenant

CREATE OR REPLACE FUNCTION validate_tenant_consistency() RETURNS TRIGGER AS $$
BEGIN
  -- For contracts, ensure customer belongs to same tenant
  IF TG_TABLE_NAME = 'contracts' THEN
    IF NOT EXISTS (
      SELECT 1 FROM customers 
      WHERE id = NEW.customer_id AND tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'Customer does not belong to the same tenant';
    END IF;
  END IF;

  -- For revenue recognitions, ensure contract belongs to same tenant
  IF TG_TABLE_NAME = 'revenue_recognitions' THEN
    IF NOT EXISTS (
      SELECT 1 FROM contracts 
      WHERE id = NEW.contract_id AND tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'Contract does not belong to the same tenant';
    END IF;
    
    -- Also ensure performance obligation belongs to the contract
    IF NOT EXISTS (
      SELECT 1 FROM performance_obligations po
      JOIN contracts c ON c.id = po.contract_id
      WHERE po.id = NEW.performance_obligation_id 
      AND c.tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'Performance obligation does not belong to the same tenant';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply tenant consistency triggers
DROP TRIGGER IF EXISTS validate_contract_tenant_consistency ON contracts;
CREATE TRIGGER validate_contract_tenant_consistency
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION validate_tenant_consistency();

DROP TRIGGER IF EXISTS validate_revenue_tenant_consistency ON revenue_recognitions;
CREATE TRIGGER validate_revenue_tenant_consistency
  BEFORE INSERT OR UPDATE ON revenue_recognitions
  FOR EACH ROW EXECUTE FUNCTION validate_tenant_consistency();

-- Audit trigger for tracking changes
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS TRIGGER AS $$
DECLARE
  tenant_id_val UUID;
BEGIN
  -- Get tenant_id from the record
  IF TG_OP = 'DELETE' THEN
    tenant_id_val := OLD.tenant_id;
  ELSE
    tenant_id_val := NEW.tenant_id;
  END IF;

  -- Insert audit record
  INSERT INTO audit_logs (
    tenant_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    tenant_id_val,
    TG_OP::audit_action,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
      ELSE NEW.id::TEXT
    END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    NOW()
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to main tables
DROP TRIGGER IF EXISTS audit_customers ON customers;
CREATE TRIGGER audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_contracts ON contracts;
CREATE TRIGGER audit_contracts
  AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_performance_obligations ON performance_obligations;
CREATE TRIGGER audit_performance_obligations
  AFTER INSERT OR UPDATE OR DELETE ON performance_obligations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_revenue_recognitions ON revenue_recognitions;
CREATE TRIGGER audit_revenue_recognitions
  AFTER INSERT OR UPDATE OR DELETE ON revenue_recognitions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
