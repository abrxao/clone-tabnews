import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const activationTokenID = request.query.token_id;
  const validActivationToken =
    await activation.findOneValidByTokenID(activationTokenID);

  await activation.activateUserByUserID(validActivationToken.user_id);

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenID);
  const securedOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    usedActivationToken,
  );
  return response.status(200).json(securedOutputValues);
}
