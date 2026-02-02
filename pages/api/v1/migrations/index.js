import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import migrator from "models/migrator";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:migration"), getHandler);
router.post(controller.canRequest("create:migration"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const pendingMigrations = await migrator.listPendingMigrations();
  const securedOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:migration",
    pendingMigrations,
  );
  return response.status(200).json(securedOutputValues);
}

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;

  const migratedMigrations = await migrator.runPendingMigrations();
  const securedOutputValues = authorization.filterOutput(
    userTryingToPost,
    "read:migration",
    migratedMigrations,
  );
  if (migratedMigrations.length > 0) {
    return response.status(201).json(securedOutputValues);
  }

  return response.status(200).json(securedOutputValues);
}
