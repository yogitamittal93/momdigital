require('dotenv').config();
const { Client } = require('pg');

const connStr =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_zx8NiypJ9QXu@ep-calm-moon-a4kcl7bo.us-east-1.aws.neon.tech/neondb?sslmode=require';

// The manual SQL used snake_case columns (post_id, user_id).
// Prisma expects the same snake_case (it maps camelCase field names TO snake_case).
// The real issue is the Prisma schema field is `postId` which maps to column `post_id`.
// But Prisma is looking for `post_id` in post_likes, which IS what we created.
// Let's verify what columns actually exist and fix if needed.

const checkSql = `
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name IN ('community_posts', 'post_likes')
  ORDER BY table_name, column_name;
`;

const c = new Client({ connectionString: connStr, connectionTimeoutMillis: 30000 });
c.connect()
  .then(() => c.query(checkSql))
  .then(res => {
    console.log('Current columns:');
    res.rows.forEach(r => console.log(' ', r.table_name || '', r.column_name));
    c.end();
  })
  .catch(e => { console.error('Error:', e.message); c.end(); });
