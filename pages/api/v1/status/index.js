import db from "infra/database.js";
import { InternalServerError } from "infra/errors";
async function status(_, response) {
  try {
    const versionResult = await db.query("SHOW server_version");
    const version = versionResult.rows[0].server_version;

    const maxConnectionsResult = await db.query("SHOW max_connections");
    const maxConnections = maxConnectionsResult.rows[0].max_connections;

    const dbName = process.env.POSTGRES_DB;
    const dbOpenConnectionsResult = await db.query({
      text: `SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1`,
      values: [dbName],
    });

    const updatedAt = new Date().toISOString();

    const openedConnections = dbOpenConnectionsResult.rows[0].count;
    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version,
          opened_connections: openedConnections,
          max_connections: parseInt(maxConnections),
        },
      },
    });
  } catch (error) {
    const publicErrorObject = new InternalServerError({
      cause: error,
    });
    console.error(publicErrorObject);
    return response.status(500).json(publicErrorObject);
  }
}

export default status;
