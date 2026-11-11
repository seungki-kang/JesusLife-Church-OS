begin;
-- COS-CHURCH-042: member notice list is newest first (publish_at desc, id desc).
-- Events reuse ix_event_time(tenant_id, starts_at) for start-time order.
create index ix_notice_publish_order on church_core.notice(tenant_id, publish_at desc, id desc);
-- COS-CHURCH-043: manage lists are most recently edited first.
create index ix_notice_updated_order on church_core.notice(tenant_id, updated_at desc, id desc);
create index ix_event_updated_order on church_core.church_event(tenant_id, updated_at desc, id desc);
commit;
