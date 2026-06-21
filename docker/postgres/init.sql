-- Runs once on first Postgres container start (mounted into
-- /docker-entrypoint-initdb.d). Enables pgvector so report embeddings can live
-- in the same database used for everything else — no separate vector store.
CREATE EXTENSION IF NOT EXISTS vector;
