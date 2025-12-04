import database from "infra/database";
import email from "infra/email";
import { NotFoundError } from "infra/errors";
import webserver from "infra/webserver";
import user from "./user";
const EXPIRATION_IN_MS = 15 * 60 * 1000; // 15 minutes in ms

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "ExternBR <contact@externbr.com>",
    to: user.email,
    subject: "Active your account on the ExternBR",
    text: `${user.username}, click on the link below to active your account on the Exchange

${webserver.origin}/register/active/${activationToken.id}

Att,
Exchange Team

`,
  });
}

async function create(userID) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MS);
  const newToken = await runInsertQuery(userID, expiresAt);
  return newToken;
  async function runInsertQuery(userID, expiresAt) {
    const results = await database.query({
      text: `
      INSERT INTO
        user_activation_tokens (user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
      ;`,
      values: [userID, expiresAt],
    });
    return results.rows[0];
  }
}
async function markTokenAsUsed(tokenID) {
  const usedToken = await runUpdateQuery(tokenID);
  return usedToken;
  async function runUpdateQuery(tokenID) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          * 
        ;`,
      values: [tokenID],
    });
    return results.rows[0];
  }
}

async function activateUserByUserID(userID) {
  const activatedUser = await user.setFeatures(userID, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

async function findOneValidByTokenID(tokenID) {
  const activationToken = await runSelectQuery(tokenID);
  return activationToken;
  async function runSelectQuery(tokenID) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id=$1
        AND expires_at > NOW()
        AND used_at IS NULL
      LIMIT
        1
      ;`,
      values: [tokenID],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Activation token not exist or expired",
        action: "Do a new register",
      });
    }

    return results.rows[0];
  }
}

const activation = {
  activateUserByUserID,
  create,
  findOneValidByTokenID,
  markTokenAsUsed,
  sendEmailToUser,
};
export default activation;
