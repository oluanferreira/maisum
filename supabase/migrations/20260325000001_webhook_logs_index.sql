CREATE INDEX idx_webhook_logs_event ON webhook_logs(event_type, created_at DESC);
