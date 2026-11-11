begin;
-- Mutation receipts retain only resulting version metadata, never content snapshots.
alter table church_integration.idempotency_record
  add column response_row_version bigint
  check (response_row_version is null or response_row_version > 0);
commit;
