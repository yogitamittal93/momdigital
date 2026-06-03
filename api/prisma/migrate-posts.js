require('dotenv').config();
const { Client } = require('pg');

const connStr =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_zx8NiypJ9QXu@ep-calm-moon-a4kcl7bo.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = `
  CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS post_likes (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
  );
  CREATE INDEX IF NOT EXISTS idx_community_posts_author_created ON community_posts(author_id, created_at DESC);
`;

const c = new Client({ connectionString: connStr, connectionTimeoutMillis: 30000 });
c.connect()
  .then(() => c.query(sql))
  .then(() => { console.log('✅ Tables community_posts and post_likes created.'); c.end(); })
  .catch(e => { console.error('❌ Error:', e.message); c.end(); process.exit(1); });
