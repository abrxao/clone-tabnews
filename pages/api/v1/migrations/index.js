import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

export default async function migrations(request, response) {
  const dbClient = await database.getNewClient();
  const migrationsOptions = {
    direction: "up",
    dir: join("infra", "migrations"),
    dbClient: dbClient,
    verbose: true,
    migrationsTable: "pgmigrations",
  };
  if (request.method == "GET") {
    migrationsOptions.dryRun = true;
    const peddingMigrations = await migrationRunner(migrationsOptions);
    await dbClient.end();
    return response.status(200).json(peddingMigrations);
  }

  if (request.method == "POST") {
    migrationsOptions.dryRun = false;
    const migratedMigrations = await migrationRunner(migrationsOptions);
    await dbClient.end();
    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  }

  return response.status(405);
}
