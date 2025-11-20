import crypto from "node:crypto";
import database from "infra/database";

const EXPIRATION_IN_MS = 30 * 24 * 60 * 60 * 1000; // 30 DAYS

async function create(userID) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MS);
  const newSession = await runInsertQuery(token, userID, expiresAt);
  return newSession;

  async function runInsertQuery(token, userID, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO 
          sessions(token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
        ;`,
      values: [token, userID, expiresAt],
    });

    return results.rows[0];
  }
}

const session = { create, EXPIRATION_IN_MS };

export default session;
