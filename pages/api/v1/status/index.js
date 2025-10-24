import db from "infra/database.js";

async function status(_, response) {
  const updatedAt = new Date().toISOString();

  const versionResult = await db.query("SHOW server_version");
  const version = versionResult.rows[0].server_version;

  const maxConnectionsResult = await db.query("SHOW max_connections");
  const maxConnections = maxConnectionsResult.rows[0].max_connections;

  const dbName = process.env.POSTGRES_DB;
  const dbOpenConnectionsResult = await db.query({
    text: `SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1`,
    values: [dbName],
  });

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
}

export default status;
