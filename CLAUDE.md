# Hyakumonogatari - Claude Code Instructions

## CRITICAL RULES

### Setup UI Only - NO EXCEPTIONS
**ALL configuration (DB credentials, OpenAI API key, compute pool, etc.) MUST be done through the Setup UI.**

- NEVER run `CALL app_setup.configure_database(...)` or any configuration procedure directly
- NEVER offer direct SQL as an alternative to Setup UI
- NEVER bypass Setup UI for "convenience" or "speed"
- If user needs to configure the app, say: "Setup UIをSnowsightで開いて設定してください"

This rule exists because:
1. Gallery Compatible App pattern requires consumer configuration through UI
2. Direct SQL breaks the intended user experience
3. User explicitly mandated this rule

## Project Overview
- Japanese storytelling app (百物語) with audio recording and AI transcription
- Deployed as Snowflake Native App with SPCS
- Follows Gallery Compatible App Template v3
