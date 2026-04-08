import "reflect-metadata";

// Tests never hit a real database. Services that need Prisma receive a
// hand-rolled mock. Tests never hit a real JWT secret from disk either;
// they set `AUTH_SECRET` here so env validation passes when the config
// module is imported from inside a test module.
process.env.NODE_ENV ??= "test";
process.env.AUTH_SECRET ??= "test-auth-secret-at-least-32-characters-xx";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.API_PORT ??= "4001";
