import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenID = request.query.token_id;

  const validActivationToken =
    await activation.findOneValidByTokenID(activationTokenID);
  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenID);
  await activation.activateUserByUserID(validActivationToken.user_id);

  return response.status(200).json(usedActivationToken);
}
