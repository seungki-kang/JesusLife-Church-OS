begin;
-- Receipts store identity and response metadata, never request/notice bodies.
alter table church_integration.idempotency_record
  add column response_resource_id uuid,
  add column response_created_at timestamptz;
alter table church_integration.idempotency_record
  add constraint command_receipt_metadata_pair
  check ((response_resource_id is null) = (response_created_at is null));
commit;
