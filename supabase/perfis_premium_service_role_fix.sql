-- DEPRECATED: não recrie o trigger aqui — use perfis_privileged_guard.sql (inclui contadores IA).
-- Este arquivo mantém apenas activate_premium_subscription para ambientes que ainda não têm
-- supabase/activate_premium_subscription.sql aplicado.
--
-- Com o trigger atual, service_role já bypassa perfis_guard_privileged_columns;
-- DISABLE/ENABLE TRIGGER abaixo é redundante mas inofensivo.

\echo 'Use activate_premium_subscription.sql em ambientes novos. Trigger: perfis_privileged_guard.sql'
