/**
 * Runs the post_comments migration using the same DATABASE_URL that Prisma reads.
 * Execute with: node prisma/run-migration.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Client } = require('pg');

const connStr = process.env.DATABASE_URL;
if (!connStr) {
  console.error('❌ DATABASE_URL not set in .env');
  process.exit(1);
}

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

const c = new Client({
  connectionString: connStr,
  connectionTimeoutMillis: 30000,
  ssl: { rejectUnauthorized: false },
});

console.log('Connecting to DB…');
c.connect()
  .then(() => {
    console.log('Connected. Running migration…');
    return c.query(sql);
  })
  .then(() => {
    console.log('✅ post_comments table ready.');
    c.end();
  })
  .catch((e) => {
    console.error('❌', e.message);
    c.end();
    process.exit(1);
  });
