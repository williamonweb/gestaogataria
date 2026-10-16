CREATE TABLE IF NOT EXISTS order_costs (
 order_id text PRIMARY KEY REFERENCES orders(id), payload jsonb NOT NULL, total integer NOT NULL CHECK(total>=0),
 confirmed boolean NOT NULL DEFAULT false, revision integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS profit_distributions (
 order_id text PRIMARY KEY REFERENCES orders(id), revenue integer NOT NULL CHECK(revenue>=0),
 cost integer NOT NULL CHECK(cost>=0), profit integer NOT NULL, reserve_bps integer NOT NULL CHECK(reserve_bps BETWEEN 0 AND 10000),
 reserve integer NOT NULL CHECK(reserve>=0), william integer NOT NULL CHECK(william>=0), jeslie integer NOT NULL CHECK(jeslie>=0),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(reserve+william+jeslie=GREATEST(profit,0)), CHECK(william=jeslie)
);
CREATE TABLE IF NOT EXISTS partner_payouts (
 id text PRIMARY KEY, partner text NOT NULL CHECK(partner IN ('william','jeslie')), amount integer NOT NULL CHECK(amount>0),
 date text NOT NULL, method text NOT NULL, notes text NOT NULL, ledger_id text NOT NULL UNIQUE REFERENCES ledger(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payout_allocations (
 payout_id text NOT NULL REFERENCES partner_payouts(id), order_id text NOT NULL REFERENCES profit_distributions(order_id),
 amount integer NOT NULL CHECK(amount>0), PRIMARY KEY(payout_id,order_id)
);
CREATE INDEX IF NOT EXISTS payout_allocations_order_idx ON payout_allocations(order_id);
