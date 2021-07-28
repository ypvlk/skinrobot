PRAGMA auto_vacuum = INCREMENTAL;

CREATE TABLE IF NOT EXISTS candlesticks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  exchange   VARCHAR(255) NULL,
  symbol     VARCHAR(255) NULL,
  period     VARCHAR(255) NULL,
  time       INTEGER      NULL,
  open       REAL         NULL,
  high       REAL         NULL,
  low        REAL         NULL,
  close      REAL         NULL,
  volume     REAL         NULL
);

CREATE UNIQUE INDEX unique_candle
  ON candlesticks (exchange, symbol, period, time);

CREATE INDEX time_idx ON candlesticks (time);
CREATE INDEX exchange_symbol_idx ON candlesticks (exchange, symbol);

CREATE TABLE IF NOT EXISTS candlesticks_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  income_at  BIGINT       NULL,
  exchange   VARCHAR(255) NULL,
  symbol     VARCHAR(255) NULL,
  period     VARCHAR(255) NULL,
  time       INTEGER      NULL,
  open       REAL         NULL,
  high       REAL         NULL,
  low        REAL         NULL,
  close      REAL         NULL,
  volume     REAL         NULL
);
CREATE INDEX candle_idx ON candlesticks_log (exchange, symbol, period, time);

CREATE TABLE IF NOT EXISTS tickers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  exchange   VARCHAR(255) NULL,
  symbol     VARCHAR(255) NULL,
  bidPrice   REAL         NULL,
  bidSize    REAL         NULL,
  askPrice   REAL         NULL,
  askSize    REAL         NULL,
  period     REAL         NULL,
  close      REAL         NULL,
  income_at  BIGINT       NULL
);
CREATE INDEX tickers_idx ON tickers (exchange, symbol);
CREATE INDEX tickers_time_idx ON tickers (exchange, symbol, income_at);

CREATE TABLE IF NOT EXISTS logs (
  uuid       VARCHAR(64) PRIMARY KEY,
  level      VARCHAR(32) NOT NULL,
  message    TEXT NULL,
  created_at INT NOT NULL
);

CREATE INDEX created_at_idx ON logs (created_at);
CREATE INDEX level_created_at_idx ON logs (level, created_at);
CREATE INDEX level_idx ON logs (level);

CREATE TABLE IF NOT EXISTS mean_reversion (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_exchange        VARCHAR(255) NULL,
  lead_symbol        VARCHAR(255) NULL,
  lead_change      REAL         NULL,
  lead_price      REAL         NULL,
  lead_side        VARCHAR(50)  NULL,
  lead_tier      REAL         NULL,
  lead_amount      REAL         NULL,
  driven_exchange        VARCHAR(255) NULL,
  driven_symbol        VARCHAR(255) NULL,
  driven_change      REAL         NULL,
  driven_price      REAL         NULL,
  adj_driven_change      REAL         NULL,
  driven_side        VARCHAR(50)  NULL,
  driven_tier      REAL         NULL,
  driven_amount      REAL         NULL,
  delta      REAL         NULL,
  signal        VARCHAR(50)  NULL,
  balance      REAL         NULL,
  balance_comm      REAL         NULL,
  income_at         BIGINT       NULL
);

CREATE INDEX income_at_idx ON mean_reversion (income_at);

CREATE TABLE IF NOT EXISTS signals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  exchange   VARCHAR(255) NULL,
  symbol     VARCHAR(255) NULL,
  side        VARCHAR(50)  NULL,
  size        REAL         NULL,
  price       REAL         NULL,
  order_type VARCHAR(50)  NULL,
  strategy   VARCHAR(50)  NULL,
  action     VARCHAR(50)  NULL,
  income_at  BIGINT       NULL
);
CREATE INDEX symbol_str_idx ON signals (exchange, symbol, strategy);

CREATE TABLE IF NOT EXISTS actions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  exchange   VARCHAR(255) NULL,
  symbol     VARCHAR(255) NULL,
  type        VARCHAR(50)  NULL,
  order_type        VARCHAR(50)  NULL,
  order_side        VARCHAR(50)  NULL,
  order_amount       REAL         NULL,
  order_price       REAL         NULL,
  income_at  BIGINT       NULL
);
CREATE INDEX actions_tickers_idx ON actions (exchange, symbol);