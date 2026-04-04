-- ============================================================
-- Hyakumonogatari - Configuration Module
-- Manages EAI references, database connection, and diagnostics.
-- ============================================================

-- ============================================================
-- EAI Reference Callbacks
-- ============================================================

CREATE OR REPLACE PROCEDURE app_setup.register_reference(
    ref_name VARCHAR,
    operation VARCHAR,
    ref_or_alias VARCHAR
)
RETURNS VARCHAR
LANGUAGE SQL
EXECUTE AS OWNER
AS
$$
BEGIN
    CASE (operation)
        WHEN 'ADD' THEN
            SELECT SYSTEM$SET_REFERENCE(:ref_name, :ref_or_alias);
        WHEN 'REMOVE' THEN
            SELECT SYSTEM$REMOVE_REFERENCE(:ref_name, :ref_or_alias);
        WHEN 'CLEAR' THEN
            SELECT SYSTEM$REMOVE_ALL_REFERENCES(:ref_name);
        ELSE
            RETURN 'Unknown operation: ' || operation;
    END CASE;
    RETURN 'OK';
END;
$$;

GRANT USAGE ON PROCEDURE app_setup.register_reference(VARCHAR, VARCHAR, VARCHAR)
    TO APPLICATION ROLE app_admin;

-- Called by platform to get EAI configuration (host_ports, allowed_secrets).
CREATE OR REPLACE PROCEDURE app_setup.get_eai_configuration(ref_name VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
EXECUTE AS OWNER
AS
$$
DECLARE
    db_host VARCHAR;
    db_port VARCHAR;
    config_json VARCHAR;
BEGIN
    SELECT value INTO :db_host FROM app_config.settings WHERE key = 'db_host';
    SELECT value INTO :db_port FROM app_config.settings WHERE key = 'db_port';

    IF (:db_host IS NULL OR :db_host = '') THEN
        -- Return placeholder with OpenAI API access
        RETURN '{"type": "CONFIGURATION", "payload": {"host_ports": ["api.openai.com:443"], "allowed_secrets": "ALL"}}';
    END IF;

    db_port := COALESCE(:db_port, '5432');
    db_host := REPLACE(:db_host, '"', '');
    db_port := REPLACE(:db_port, '"', '');

    -- Include both database host and OpenAI API
    config_json := '{'
        || '"type": "CONFIGURATION",'
        || '"payload": {'
        ||     '"host_ports": ["' || :db_host || ':' || :db_port || '", "api.openai.com:443"],'
        ||     '"allowed_secrets": "ALL"'
        || '}'
        || '}';

    RETURN config_json;
END;
$$;

GRANT USAGE ON PROCEDURE app_setup.get_eai_configuration(VARCHAR)
    TO APPLICATION ROLE app_admin;

-- ============================================================
-- Database Connection Configuration
-- ============================================================

CREATE OR REPLACE PROCEDURE app_setup.configure_database(
    p_host VARCHAR,
    p_port VARCHAR DEFAULT '5432',
    p_user VARCHAR DEFAULT 'admin',
    p_pass VARCHAR DEFAULT '',
    p_db_name VARCHAR DEFAULT 'postgres',
    p_openai_key VARCHAR DEFAULT ''
)
RETURNS VARCHAR
LANGUAGE SQL
EXECUTE AS OWNER
AS
$$
DECLARE
    safe_user VARCHAR;
    safe_pass VARCHAR;
    safe_openai VARCHAR;
BEGIN
    IF (:p_host IS NULL OR :p_host = '') THEN
        RETURN 'ERROR: Database host is required';
    END IF;
    IF (:p_pass IS NULL OR :p_pass = '') THEN
        RETURN 'ERROR: Database password is required';
    END IF;

    safe_user := REPLACE(:p_user, '''', '''''');
    safe_pass := REPLACE(:p_pass, '''', '''''');

    -- Store PostgreSQL credentials
    BEGIN
        EXECUTE IMMEDIATE
            'CREATE OR REPLACE SECRET app_config.db_credentials '
            || 'TYPE = PASSWORD '
            || 'USERNAME = ''' || :safe_user || ''' '
            || 'PASSWORD = ''' || :safe_pass || '''';
    EXCEPTION WHEN OTHER THEN
        RETURN 'ERROR creating db_credentials: ' || SQLERRM;
    END;

    -- Store OpenAI API key if provided
    IF (:p_openai_key IS NOT NULL AND :p_openai_key != '') THEN
        safe_openai := REPLACE(:p_openai_key, '''', '''''');
        BEGIN
            EXECUTE IMMEDIATE
                'CREATE OR REPLACE SECRET app_config.openai_credentials '
                || 'TYPE = GENERIC_STRING '
                || 'SECRET_STRING = ''' || :safe_openai || '''';
        EXCEPTION WHEN OTHER THEN
            RETURN 'ERROR creating openai_credentials: ' || SQLERRM;
        END;
    END IF;

    -- Store non-sensitive config in settings table
    MERGE INTO app_config.settings AS t
    USING (
        SELECT column1 AS key, column2 AS value FROM VALUES
            ('db_host', :p_host),
            ('db_port', :p_port),
            ('db_user', :p_user),
            ('db_name', :p_db_name),
            ('db_configured', 'true')
    ) AS s
    ON t.key = s.key
    WHEN MATCHED THEN UPDATE SET value = s.value, updated_at = CURRENT_TIMESTAMP()
    WHEN NOT MATCHED THEN INSERT (key, value) VALUES (s.key, s.value);

    RETURN 'Database configured: ' || :p_host || ':' || :p_port || '/' || :p_db_name
        || '. Please approve the External Access Integration in the app settings.';
END;
$$;

GRANT USAGE ON PROCEDURE app_setup.configure_database(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR)
    TO APPLICATION ROLE app_admin;

-- ============================================================
-- Status & Diagnostics
-- ============================================================

CREATE OR REPLACE PROCEDURE app_setup.get_config_status()
RETURNS VARCHAR
LANGUAGE SQL
EXECUTE AS OWNER
AS
$$
DECLARE
    configured VARCHAR DEFAULT 'false';
    db_host VARCHAR DEFAULT '';
    db_port VARCHAR DEFAULT '';
    db_user VARCHAR DEFAULT '';
    pool_name VARCHAR DEFAULT '';
    result VARCHAR;
BEGIN
    BEGIN SELECT value INTO :configured FROM app_config.settings WHERE key = 'db_configured';
    EXCEPTION WHEN OTHER THEN configured := 'false'; END;
    BEGIN SELECT value INTO :db_host FROM app_config.settings WHERE key = 'db_host';
    EXCEPTION WHEN OTHER THEN NULL; END;
    BEGIN SELECT value INTO :db_port FROM app_config.settings WHERE key = 'db_port';
    EXCEPTION WHEN OTHER THEN NULL; END;
    BEGIN SELECT value INTO :db_user FROM app_config.settings WHERE key = 'db_user';
    EXCEPTION WHEN OTHER THEN NULL; END;
    BEGIN SELECT value INTO :pool_name FROM app_config.settings WHERE key = 'compute_pool';
    EXCEPTION WHEN OTHER THEN NULL; END;

    result := '{'
        || '"configured": "' || COALESCE(:configured, 'false') || '",'
        || '"db_host": "' || COALESCE(:db_host, '') || '",'
        || '"db_port": "' || COALESCE(:db_port, '') || '",'
        || '"db_user": "' || COALESCE(:db_user, '') || '",'
        || '"compute_pool": "' || COALESCE(:pool_name, '') || '"'
        || '}';

    RETURN result;
END;
$$;

GRANT USAGE ON PROCEDURE app_setup.get_config_status()
    TO APPLICATION ROLE app_admin;
GRANT USAGE ON PROCEDURE app_setup.get_config_status()
    TO APPLICATION ROLE app_user;

-- ============================================================
-- Debug: Check Secrets
-- ============================================================

CREATE OR REPLACE PROCEDURE app_setup.check_secrets()
RETURNS VARCHAR
LANGUAGE SQL
EXECUTE AS OWNER
AS
$$
DECLARE
    db_exists BOOLEAN DEFAULT FALSE;
    openai_exists BOOLEAN DEFAULT FALSE;
    result VARCHAR;
BEGIN
    BEGIN
        EXECUTE IMMEDIATE 'DESCRIBE SECRET app_config.db_credentials';
        db_exists := TRUE;
    EXCEPTION WHEN OTHER THEN
        db_exists := FALSE;
    END;

    BEGIN
        EXECUTE IMMEDIATE 'DESCRIBE SECRET app_config.openai_credentials';
        openai_exists := TRUE;
    EXCEPTION WHEN OTHER THEN
        openai_exists := FALSE;
    END;

    result := '{"db_credentials": ' || db_exists::VARCHAR
           || ', "openai_credentials": ' || openai_exists::VARCHAR || '}';

    RETURN result;
END;
$$;

GRANT USAGE ON PROCEDURE app_setup.check_secrets()
    TO APPLICATION ROLE app_admin;

-- ============================================================
-- Reset Configuration
-- ============================================================

CREATE OR REPLACE PROCEDURE app_setup.reset_config()
RETURNS VARCHAR
LANGUAGE SQL
EXECUTE AS OWNER
AS
$$
BEGIN
    BEGIN
        ALTER SERVICE IF EXISTS app_services.hyakumonogatari SUSPEND;
    EXCEPTION WHEN OTHER THEN NULL; END;

    BEGIN
        DROP SECRET IF EXISTS app_config.db_credentials;
    EXCEPTION WHEN OTHER THEN NULL; END;

    BEGIN
        DROP SECRET IF EXISTS app_config.openai_credentials;
    EXCEPTION WHEN OTHER THEN NULL; END;

    DELETE FROM app_config.settings
    WHERE key IN ('db_host', 'db_port', 'db_user', 'db_configured');

    RETURN 'Configuration reset. You can reconfigure the database connection.';
END;
$$;

GRANT USAGE ON PROCEDURE app_setup.reset_config()
    TO APPLICATION ROLE app_admin;
