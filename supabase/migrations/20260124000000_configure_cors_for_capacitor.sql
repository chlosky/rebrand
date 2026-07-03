-- Configure CORS for Capacitor iOS app
-- This allows capacitor://localhost to access the PostgREST API
-- Note: This only affects the database API, not the Auth API

-- Set CORS allowed origins for PostgREST
ALTER ROLE authenticator SET pgrst.server_cors_allowed_origins = 'capacitor://localhost,https://localhost,http://localhost';

-- Reload PostgREST configuration
NOTIFY pgrst, 'reload config';
