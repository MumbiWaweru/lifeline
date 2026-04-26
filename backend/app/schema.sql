-- LIFELINE PostgreSQL Schema (Third Normal Form, UUID PKs, PostGIS)
-- Matches report Table 5.1 and ERD specification

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────
-- 1. USERS  (Survivors, Counselors, Admins)
-- ─────────────────────────────────────────────
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(255) UNIQUE,          -- NULL for anonymous survivors
    password_hash       TEXT,
    role                VARCHAR(20) NOT NULL CHECK (role IN ('survivor','counselor','admin')),
    is_anonymous        BOOLEAN NOT NULL DEFAULT FALSE,
    display_name        VARCHAR(100),
    language            VARCHAR(10) NOT NULL DEFAULT 'en',
    totp_secret         TEXT,                          -- base32 TOTP seed
    totp_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    email_verify_token  TEXT,
    email_verify_expiry TIMESTAMP,
    failed_login_count  INTEGER NOT NULL DEFAULT 0,
    locked_until        TIMESTAMP,
    last_login          TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ─────────────────────────────────────────────
-- 2. SUPPORT SERVICES  (resource directory)
-- ─────────────────────────────────────────────
CREATE TABLE support_services (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    service_type    VARCHAR(50) NOT NULL,  -- shelter, legal, medical, counseling, hotline
    phone           VARCHAR(30),
    email           VARCHAR(255),
    website         VARCHAR(500),
    address         TEXT,
    county          VARCHAR(100),
    location        GEOGRAPHY(POINT, 4326),  -- PostGIS geospatial
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    operating_hours JSONB,                  -- {"mon":"08:00-17:00", ...}
    languages       TEXT[],
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_location ON support_services USING GIST(location);
CREATE INDEX idx_services_type     ON support_services(service_type);
CREATE INDEX idx_services_county   ON support_services(county);

-- ─────────────────────────────────────────────
-- 3. RISK ASSESSMENTS
-- ─────────────────────────────────────────────
CREATE TABLE risk_assessments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    session_token   TEXT,                  -- for anonymous survivors
    input_text      TEXT NOT NULL,
    risk_level      VARCHAR(10) NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
    confidence      FLOAT NOT NULL,
    explanation     JSONB,                 -- LIME per-phrase scores
    model_version   VARCHAR(50),
    processing_ms   INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_assessments_level   ON risk_assessments(risk_level);
CREATE INDEX idx_risk_assessments_user    ON risk_assessments(user_id);
CREATE INDEX idx_risk_assessments_session ON risk_assessments(session_token);

-- ─────────────────────────────────────────────
-- 4. CASES  (survivor ↔ counselor assignment)
-- ─────────────────────────────────────────────
CREATE TABLE cases (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survivor_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    counselor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    risk_assessment_id  UUID REFERENCES risk_assessments(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','in_progress','resolved','closed')),
    risk_level          VARCHAR(10) NOT NULL DEFAULT 'low'
                            CHECK (risk_level IN ('low','medium','high','critical')),
    is_flagged          BOOLEAN NOT NULL DEFAULT FALSE,
    notes               TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at           TIMESTAMP
);

CREATE INDEX idx_cases_status      ON cases(status);
CREATE INDEX idx_cases_counselor   ON cases(counselor_id);
CREATE INDEX idx_cases_survivor    ON cases(survivor_id);
CREATE INDEX idx_cases_risk        ON cases(risk_level);

-- ─────────────────────────────────────────────
-- 5. MESSAGES  (E2EE, AES-256-GCM)
-- ─────────────────────────────────────────────
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    sender_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    ciphertext      TEXT NOT NULL,         -- base64(AES-256-GCM encrypted content)
    iv              TEXT NOT NULL,         -- base64 96-bit random IV
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    auto_destruct_at TIMESTAMP,            -- NULL = no auto-destruct
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_case      ON messages(case_id);
CREATE INDEX idx_messages_sender    ON messages(sender_id);
CREATE INDEX idx_messages_destruct  ON messages(auto_destruct_at)
    WHERE auto_destruct_at IS NOT NULL;

-- ─────────────────────────────────────────────
-- 6. ALERTS  (threat detection escalations)
-- ─────────────────────────────────────────────
CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    risk_level      VARCHAR(10) NOT NULL,
    trigger_text    TEXT,
    risk_score      FLOAT,
    explanation     JSONB,
    acknowledged    BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_case          ON alerts(case_id);
CREATE INDEX idx_alerts_acknowledged  ON alerts(acknowledged);

-- ─────────────────────────────────────────────
-- 7. RESOURCE MATCHES  (logged recommendations)
-- ─────────────────────────────────────────────
CREATE TABLE resource_matches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id   UUID REFERENCES risk_assessments(id) ON DELETE CASCADE,
    service_id      UUID REFERENCES support_services(id) ON DELETE CASCADE,
    distance_km     FLOAT,
    score           FLOAT,
    rank            INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resource_matches_assessment ON resource_matches(assessment_id);

-- ─────────────────────────────────────────────
-- 8. SESSIONS  (JWT revocation list / Redis mirror)
-- ─────────────────────────────────────────────
CREATE TABLE sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    jti         TEXT UNIQUE NOT NULL,      -- JWT ID for revocation
    expires_at  TIMESTAMP NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_jti     ON sessions(jti);
CREATE INDEX idx_sessions_user    ON sessions(user_id);

-- ─────────────────────────────────────────────
-- 9. AUDIT LOG
-- ─────────────────────────────────────────────
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   UUID,
    ip_address  INET,
    user_agent  TEXT,
    metadata    JSONB,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_actor  ON audit_log(actor_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- ─────────────────────────────────────────────
-- Seed: Sample support services (Nairobi area)
-- ─────────────────────────────────────────────
INSERT INTO support_services (name, description, service_type, phone, county, location, languages)
VALUES
  ('FIDA Kenya', 'Free legal aid for GBV survivors', 'legal', '0800720519',
   'Nairobi', ST_GeogFromText('POINT(36.8219 -1.2921)'), ARRAY['en','sw']),
  ('Nairobi Women''s Hospital GBV Recovery Centre', 'Medical & psychosocial support', 'medical', '0719638006',
   'Nairobi', ST_GeogFromText('POINT(36.7922 -1.3003)'), ARRAY['en','sw']),
  ('Kenyan National GBV Hotline', '24/7 crisis hotline', 'hotline', '1195',
   'National', ST_GeogFromText('POINT(36.8219 -1.2921)'), ARRAY['en','sw','ki']),
  ('COVAW', 'Coalition on Violence Against Women', 'counseling', '0722177466',
   'Nairobi', ST_GeogFromText('POINT(36.8350 -1.2880)'), ARRAY['en','sw']),
  ('Ujamaa Africa', 'Shelter and psychosocial support', 'shelter', '0720614411',
   'Nairobi', ST_GeogFromText('POINT(36.8100 -1.3100)'), ARRAY['en','sw']);