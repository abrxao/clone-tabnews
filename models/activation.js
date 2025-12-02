import database from "infra/database";
import email from "infra/email";
import webserver from "infra/webserver";
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

async function findOneByUserID(userID) {
  const activationToken = await runSelectQuery(userID);
  return activationToken;
  async function runSelectQuery(userID) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        user_id=$1
      LIMIT
        1
      ;`,
      values: [userID],
    });
    return results.rows[0];
  }
}

const activation = { create, findOneByUserID, sendEmailToUser };
export default activation;
