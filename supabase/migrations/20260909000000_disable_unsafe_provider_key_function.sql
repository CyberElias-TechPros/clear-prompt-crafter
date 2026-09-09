-- Security gate: the old API-key path only generated a UUID and never
-- encrypted or stored the provider secret. Disable it until a real vault or
-- Cloudflare Worker secret flow is deployed.
CREATE OR REPLACE FUNCTION public.encrypt_api_key(key_value TEXT)
RETURNS UUID AS $$
BEGIN
  RAISE EXCEPTION 'Provider secret storage is not configured';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.encrypt_api_key(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_api_key(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.encrypt_api_key(TEXT) FROM authenticated;

COMMENT ON FUNCTION public.encrypt_api_key(TEXT) IS
  'Disabled safety gate. Replace with a real secret-management implementation before enabling provider connections.';
