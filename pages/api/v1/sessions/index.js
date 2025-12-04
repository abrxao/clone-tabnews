import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication";
import authorization from "models/authorization";
import session from "models/session";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;
  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );
  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "You don't have permission to login",
      action: "Verify if your account is activated or contact support",
    });
  }
  const newSession = await session.create(authenticatedUser.id);
  controller.setSessionCookie(newSession.token, response);

  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireByID(sessionObject.id);
  controller.clearSessionCookie(response);
  return response.status(200).json(expiredSession);
}
