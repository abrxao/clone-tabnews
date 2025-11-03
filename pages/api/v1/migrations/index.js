import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";

export default async function migrations(request, response) {
  const allowedMethods = ["POST", "GET"];
  if (!allowedMethods.includes(request.method)) {
    return response
      .status(405)
      .json({ error: `Method "${request.method}" not allowed` });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();
    const migrationsOptions = {
      direction: "up",
      dir: resolve("infra", "migrations"),
      dbClient: dbClient,
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    if (request.method == "GET") {
      migrationsOptions.dryRun = true;
      const peddingMigrations = await migrationRunner(migrationsOptions);
      return response.status(200).json(peddingMigrations);
    }

    if (request.method == "POST") {
      migrationsOptions.dryRun = false;
      const migratedMigrations = await migrationRunner(migrationsOptions);

      if (migratedMigrations.length > 0) {
        return response.status(201).json(migratedMigrations);
      }
      return response.status(200).json(migratedMigrations);
    }
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await dbClient.end();
  }
}
