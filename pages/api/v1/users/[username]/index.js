import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);
  const securedOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user",
    userFound,
  );
  return response.status(200).json(securedOutputValues);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;
  const userTryingToPatch = request.context.user;
  const targetUser = await user.findOneByUsername(username);
  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "You are not allowed to update this resource",
      action: "Verify if you have permission to do this update",
    });
  }

  const updatedUser = await user.update(username, userInputValues);
  const securedOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:user",
    updatedUser,
  );
  return response.status(200).json(securedOutputValues);
}
