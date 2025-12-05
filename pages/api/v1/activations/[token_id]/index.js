import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenID = request.query.token_id;
  const validActivationToken =
    await activation.findOneValidByTokenID(activationTokenID);

  await activation.activateUserByUserID(validActivationToken.user_id);

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenID);

  return response.status(200).json(usedActivationToken);
}
