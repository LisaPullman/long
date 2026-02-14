// Default to local docker-compose postgres if not explicitly set.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/vanmart?schema=public';
}

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

