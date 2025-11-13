import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function validateUniqueEmail(email) {
    const results = await database.query({
      text: `
      SELECT
        email
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      ;`,
      values: [email],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "This email is already been used",
        action: "Use another email to create an account",
      });
    }
  }

  async function validateUniqueUsername(username) {
    const results = await database.query({
      text: `
      SELECT
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
      values: [username],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "This username is already been used",
        action: "Use another username to create an account",
      });
    }
  }

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
        INSERT INTO
          users (username, email, password)
        VALUES 
          ($1, $2, $3)
        RETURNING
          *
        ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });

    return results.rows[0];
  }
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
      ;`,
      values: [username],
    });
    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Requested username was not founded",
        action: "Verify if requested username is right",
      });
    }
    return results.rows[0];
  }
}
const user = { create, findOneByUsername };

export default user;
