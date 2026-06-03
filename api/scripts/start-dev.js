/**
 * Cross-platform start:dev — optionally wakes Neon DB, then runs nest --watch.
 */
const { execSync, spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

try {
  execSync('npx prisma db execute --file prisma/wake.sql', {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
} catch {
  // Neon cold start may fail once; Nest will retry on first query
  console.warn('[start:dev] wake:db skipped (DB may still be waking up)');
}

const nest = spawn('npx', ['nest', 'start', '--watch'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

nest.on('exit', (code) => process.exit(code ?? 0));
