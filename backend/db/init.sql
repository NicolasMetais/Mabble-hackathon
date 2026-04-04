CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE test_ping (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL
);

CREATE TYPE account_status AS ENUM ('guest', 'pending', 'accepted', 'rejected');

CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected', 'finished');

CREATE TYPE payment_status AS ENUM ('conflict', 'working', '',)

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    wallet_id TEXT UNIQUE,
    wallet_address TEXT NOT NULL,
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
    amountMBBL NUMERIC NOT NULL CHECK (price > 0),
    amountUSDC NUMERIC NOT NULL CHECK (price > 0),
    is_active BOOLEAN DEFAULT false,
    client_confirm BOOLEAN DEFAULT false,
    provider_confirm BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE request_services (
    id SERIAL PRIMARY KEY,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id),
    request_status request_status DEFAULT 'pending' NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transaction (
    id SERIAL PRIMARY KEY,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    amountMBBL NUMERIC NOT NULL CHECK (price > 0),
    amountUSDC NUMERIC NOT NULL CHECK (price > 0),
    
);

/* CA permet de bloquer la creation d'un nouveau service quand un service 
entre deux user est en train d'etre fait et de le unlock un fois finis*/
CREATE UNIQUE INDEX unique_active_request 
ON request_services (client_id, service_id) 
WHERE request_status IN ('pending', 'accepted');

INSERT INTO jobs (name) VALUES ('Developper') ON CONFLICT (name) DO NOTHING;
INSERT INTO jobs (name) VALUES ('3D Artists') ON CONFLICT (name) DO NOTHING;

INSERT INTO test_ping (message) VALUES ('PING DE LA BDD');