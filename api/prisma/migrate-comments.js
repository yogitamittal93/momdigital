require('dotenv').config();
const { Client } = require('pg');

const connStr =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_zx8NiypJ9QXu@ep-calm-moon-a4kcl7bo.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = `
  CREATE TABLE IF NOT EXISTS post_comments (
    id          TEXT PRIMARY KEY,
    post_id     TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_post_comments_post_created
    ON post_comments(post_id, created_at ASC);
`;

const c = new Client({ connectionString: connStr, connectionTimeoutMillis: 30000 });
c.connect()
  .then(() => c.query(sql))
  .then(() => { console.log('✅ post_comments table created.'); c.end(); })
  .catch(e => { console.error('❌', e.message); c.end(); process.exit(1); });
