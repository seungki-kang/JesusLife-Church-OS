begin;
-- Forward-only addition. Does not change V001-V012 migration history.
alter table church_integration.integration_connection drop constraint integration_connection_provider_check;
alter table church_integration.integration_connection add constraint integration_connection_provider_check check (provider in ('JLPRAYER','JLBIBLE','LIFE_DIARY','NEORANG_NARANG','CHGO','JLACADEMY'));
alter table church_integration.external_state_ref drop constraint external_state_ref_provider_check;
alter table church_integration.external_state_ref add constraint external_state_ref_provider_check check (provider in ('JLPRAYER','JLBIBLE','NEORANG_NARANG','JLACADEMY'));
alter table church_integration.handoff_grant drop constraint handoff_grant_provider_check;
alter table church_integration.handoff_grant add constraint handoff_grant_provider_check check (provider in ('JLPRAYER','JLBIBLE','LIFE_DIARY','NEORANG_NARANG','CHGO','JLACADEMY'));
alter table church_integration.registered_return_uri drop constraint registered_return_uri_provider_check;
alter table church_integration.registered_return_uri add constraint registered_return_uri_provider_check check (provider in ('JLPRAYER','JLBIBLE','LIFE_DIARY','NEORANG_NARANG','CHGO','JLACADEMY'));
commit;
