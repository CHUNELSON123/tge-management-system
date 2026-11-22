# TGE Database Setup

## Prerequisites
- Node.js and npm
- PostgreSQL
- A local `.env` file with a valid `DATABASE_URL`

## Install Dependencies

From the `database` directory:

```powershell
npm install
```

## Validate the Prisma Schema

```powershell
npx prisma validate
```

## Apply Existing Migrations

Apply committed migrations to the configured database:

```powershell
npx prisma migrate deploy
```

Check migration status:

```powershell
npx prisma migrate status
```

## Create a Development Migration

After an approved schema change:

```powershell
npx prisma migrate dev --name descriptive_migration_name
```

Review the generated SQL and commit the Prisma schema and migration files together.

## Production Deployment

Apply committed migrations in production using:

```powershell
npx prisma migrate deploy
```

Do not use `prisma migrate dev` against production.

## Clean Database Setup Test

Use a separate test database, not a shared development database:

```powershell
npx prisma migrate deploy
npx prisma migrate status
```

Confirm that migrations apply successfully and the database is up to date. Never reset a shared database to test setup reproducibility.

## Team Workflow

1. Pull the latest approved changes.
2. Install dependencies.
3. Configure the local `.env` file.
4. Validate the Prisma schema.
5. Apply or create migrations as appropriate.
6. Review and test migration SQL.
7. Commit schema changes and migrations together.
8. Open a pull request for review before merging.

**Security:** Never commit `.env` or expose database credentials.