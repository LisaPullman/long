const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  const backendDir = path.resolve(__dirname, '..');
  const env = { ...process.env };

  if (!env.DATABASE_URL) {
    env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/vanmart?schema=public';
  }

  // Make sure DB schema exists and seed data is present for integration tests.
  execSync('npx prisma generate', { cwd: backendDir, stdio: 'inherit', env });
  execSync('npx prisma migrate deploy', { cwd: backendDir, stdio: 'inherit', env });
  execSync('npx prisma db seed', { cwd: backendDir, stdio: 'inherit', env });
};

