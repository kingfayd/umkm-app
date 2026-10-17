# UMKM

An inventory, production, procurement, and sales application built with Next.js,
Prisma, and PostgreSQL.

## Local setup

1. Copy `.env.example` to `.env` and configure `DATABASE_URL`, `DIRECT_URL`,
   and `JWT_SECRET`. Use a randomly generated `JWT_SECRET` of at least 32 bytes.
   Never commit `.env` or share its values.
2. Install dependencies with `npm ci`.
3. Apply database migrations with `npx prisma migrate deploy`.
4. Start the development server with `npm run dev`.

Before applying migrations to an existing database, verify its Prisma migration
status and take a backup. Older migrations in this repository include destructive
table operations and must not be replayed against an untracked production schema.

The repository previously tracked `.env`. Removing it from the current revision
does not remove credentials from Git history; rotate any database credentials and
JWT secret that were ever stored there.

## Validation

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
