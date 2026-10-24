\set ON_ERROR_STOP on
-- Runtime catalog assertions; run with 00-04 after V013.
do $test$
declare t text; c text; d text;
begin
 foreach t in array array['integration_connection','external_state_ref','handoff_grant','registered_return_uri'] loop
   c := t || '_provider_check';
   select pg_get_constraintdef(oid) into d from pg_constraint
   where conrelid=('church_integration.'||t)::regclass and conname=c;
   if d is null or position('JLACADEMY' in d)=0 then raise exception 'Missing academy constraint: %',t; end if;
   if t='external_state_ref' and (position('LIFE_DIARY' in d)>0 or position('CHGO' in d)>0) then
     raise exception 'Forbidden personal-state provider';
   end if;
 end loop;
end
$test$;
select 'PASS|ACADEMY|four provider constraints include JLAcademy' as result;
