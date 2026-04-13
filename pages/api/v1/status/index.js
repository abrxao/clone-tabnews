import { createRouter } from "next-connect";
import db from "infra/database.js";
import controller from "infra/controller";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
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
  const dbStatus = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        version,
        opened_connections: openedConnections,
        max_connections: parseInt(maxConnections),
      },
    },
  };
  const securedOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    dbStatus,
  );
  response.status(200).json(securedOutputValues);
}
