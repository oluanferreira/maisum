-- ===========================================
-- Migration 008: Webhook Logs Table
-- Required by handle-payment-webhook Edge Function
-- ===========================================

CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  error TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Only service_role (Edge Functions) writes; super_admin can read
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can view webhook logs" ON webhook_logs
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );
