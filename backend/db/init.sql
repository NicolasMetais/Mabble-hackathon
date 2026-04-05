CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE test_ping (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL
);

CREATE TYPE account_status AS ENUM ('guest', 'pending', 'accepted', 'rejected');
CREATE TYPE payment_status AS ENUM ('working', 'conflict', 'withdrawable', 'finished');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected', 'finished');

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    wallet_id TEXT UNIQUE,
    wallet_address TEXT,
    wallet_user_token TEXT UNIQUE,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    jobs_id INTEGER REFERENCES jobs(id),
    other_jobs TEXT,
    description TEXT,
    github_url TEXT,
    github_username TEXT,
    github_data JSONB,
    first_connect BOOLEAN default false,
    account_status account_status DEFAULT 'guest' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admission_forms (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    portfolio_url TEXT,
    skills TEXT[],
    presentation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    jobs_id INTEGER REFERENCES jobs(id),
    description TEXT,
    amountMBBL NUMERIC NOT NULL DEFAULT 0 CHECK (amountMBBL >= 0),
    amountUSDC NUMERIC NOT NULL DEFAULT 0 CHECK (amountUSDC >= 0),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Créé avant transaction pour éviter la dépendance circulaire.
-- La FK payment_id → transaction est ajoutée via ALTER TABLE après.
CREATE TABLE request_services (
    id SERIAL PRIMARY KEY,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id),
    request_status request_status DEFAULT 'pending' NOT NULL,
    payment_id TEXT,                             -- FK vers transaction.payment_id (ajoutée après)
    description TEXT NOT NULL,
    amountMBBL NUMERIC NOT NULL DEFAULT 0 CHECK (amountMBBL >= 0),
    amountUSDC NUMERIC NOT NULL DEFAULT 0 CHECK (amountUSDC >= 0),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table de transactions on-chain (peuplée par l'event PaymentCreated via event.ts)
CREATE TABLE transaction (
    id SERIAL PRIMARY KEY,
    payment_id TEXT NOT NULL UNIQUE,            -- paymentID uint256 émis par le smart contract
    request_id INTEGER REFERENCES request_services(id) ON DELETE SET NULL,
    client_id UUID REFERENCES users(id) ON DELETE SET NULL,      -- NEW: Acheteur
    provider_id UUID REFERENCES users(id) ON DELETE SET NULL,    -- NEW: Prestataire (pour le withdraw)
    sender TEXT NOT NULL,                        -- adresse wallet (from)
    receiver TEXT NOT NULL,                      -- adresse wallet (to)
    amountMBBL NUMERIC NOT NULL CHECK (amountMBBL >= 0),
    amountUSDC NUMERIC NOT NULL CHECK (amountUSDC >= 0),
    release_timestamp BIGINT,                    -- timestamp de déblocage des fonds
    payment_status payment_status DEFAULT 'working' NOT NULL,
    conflict_address TEXT,                       -- adresse du contrat MabbleConflict si conflit ouvert
    refund_address TEXT,                         -- adresse remboursée si conflit résolu
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ajout de la FK circulaire maintenant que les deux tables existent
ALTER TABLE request_services
    ADD CONSTRAINT fk_payment_id FOREIGN KEY (payment_id) REFERENCES transaction(payment_id) ON DELETE SET NULL;

CREATE TABLE disputes (
    id SERIAL PRIMARY KEY,
    payment_id TEXT UNIQUE REFERENCES transaction(payment_id) ON DELETE CASCADE,
    solver0_id UUID REFERENCES users(id),
    solver1_id UUID REFERENCES users(id)
);

-- Table de mapping temporaire : relie (from_wallet, to_wallet) → request_id
-- Peuplée lors du /pay, consommée à la réception de PaymentCreated
CREATE TABLE payment_pending (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES request_services(id) ON DELETE CASCADE,
    from_wallet TEXT NOT NULL,
    to_wallet TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

/* Bloque la création d'un nouveau service quand un service entre deux users
est en cours, et le débloque une fois terminé */
CREATE UNIQUE INDEX unique_active_request
ON request_services (client_id, service_id)
WHERE request_status IN ('pending', 'accepted');

INSERT INTO jobs (name) VALUES 
('Frontend Developer'),
('Backend Developer'),
('Full Stack Developer'),
('DevOps Engineer'),
('Data Scientist'),
('Data Engineer'),
('Machine Learning Engineer'),
('Cybersecurity Analyst'),
('Cloud Architect'),
('Mobile Developer'),
('UI/UX Designer'),
('QA Engineer')
ON CONFLICT (name) DO NOTHING;

INSERT INTO test_ping (message) VALUES ('PING DE LA BDD');