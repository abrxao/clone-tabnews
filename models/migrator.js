import migrationRunner from "node-pg-migrate";
import database from "infra/database.js";
import { resolve } from "node:path";
import { ServiceError } from "infra/errors";

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  log: () => {},
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
    return pendingMigrations;
  } catch (e) {
    const serviceError = new ServiceError({
      message: "Error trying to list pending migrations",
    });
    throw serviceError;
  } finally {
    await dbClient.end();
  }
}

async function runPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    });

    return migratedMigrations;
  } catch (e) {
    const serviceError = new ServiceError({
      message: "Error trying to run pending migrations",
    });
    throw serviceError;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
