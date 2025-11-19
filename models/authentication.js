import { NotFoundError, UnauthorizedError } from "infra/errors";
import password from "./password";
import user from "./user";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);
    return storedUser;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new UnauthorizedError({
        action: "Verify if sended data is correct",
        message: "Authentication data doesn't match",
      });
    }
    throw error;
  }

  async function findUserByEmail(providedEmail) {
    try {
      const storedUser = await user.findOneByEmail(providedEmail);
      return storedUser;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Authentication data doesn't match",
          action: "Verify if sended data is correct",
        });
      }
      throw error;
    }
  }
  async function validatePassword(providedPassword, storedPassword) {
    const isCorrectPassword = await password.compare(
      providedPassword,
      storedPassword,
    );
    if (!isCorrectPassword) {
      throw new UnauthorizedError({
        action: "Verify if sended data is correct",
        message: "Authentication data doesn't match",
      });
    }
  }
}

const authetication = { getAuthenticatedUser };

export default authetication;
