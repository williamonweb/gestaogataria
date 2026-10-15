CREATE TABLE IF NOT EXISTS orders (
 id text PRIMARY KEY, customer text NOT NULL, phone text NOT NULL, document text,
 items text NOT NULL, total integer NOT NULL CHECK(total >= 0), status text NOT NULL,
 due text NOT NULL, notes text NOT NULL, created text NOT NULL, revision integer NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS ledger (
 id text PRIMARY KEY, order_id text REFERENCES orders(id), amount integer NOT NULL CHECK(amount <> 0),
 description text NOT NULL, method text NOT NULL, date text NOT NULL, created text NOT NULL
);
CREATE INDEX IF NOT EXISTS ledger_order_idx ON ledger(order_id);
CREATE TABLE IF NOT EXISTS quotes (
 id text PRIMARY KEY, customer text NOT NULL, number text NOT NULL, total integer NOT NULL,
 payload text NOT NULL, order_id text REFERENCES orders(id), created text NOT NULL, updated text NOT NULL,
 revision integer NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS costings (
 id text PRIMARY KEY, name text NOT NULL, payload text NOT NULL, created text NOT NULL, updated text NOT NULL,
 revision integer NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS users (
 id text PRIMARY KEY, username text NOT NULL UNIQUE, name text NOT NULL,
 password_hash text NOT NULL, role text NOT NULL CHECK(role IN ('admin','operator')),
 active boolean NOT NULL DEFAULT true, must_change_password boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS auth_limits (
 key text PRIMARY KEY, attempts integer NOT NULL, window_start timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
 id integer PRIMARY KEY CHECK(id=1), payload jsonb NOT NULL, revision integer NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS audit_log (
 id text PRIMARY KEY, user_id text REFERENCES users(id), action text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
