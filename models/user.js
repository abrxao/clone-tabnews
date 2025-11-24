import database from "infra/database";
import password from "models/password";
import { NotFoundError, ValidationError } from "infra/errors";

async function create(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);
  const newUser = await runInsertQuery(userInputValues);

  return newUser;

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

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userInputValues) {
    const newUsername = userInputValues.username;
    if (username.toLowerCase() !== newUsername.toLowerCase()) {
      await validateUniqueUsername(newUsername);
    }
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }
  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }
  const userWithNewValues = { ...currentUser, ...userInputValues };
  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          * 
        ;`,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });
    return results.rows[0];
  }
}

async function findOneByID(userID) {
  const userFound = await runSelectQuery(userID);
  return userFound;

  async function runSelectQuery(userID) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        id = $1
      LIMIT
        1
      ;`,
      values: [userID],
    });
    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Requested user ID was not founded",
        action: "Verify if requested user ID is right",
      });
    }
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

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);
  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      LIMIT
        1
      ;`,
      values: [email],
    });
    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Requested email was not founded",
        action: "Verify if requested email is right",
      });
    }
    return results.rows[0];
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
      action: "Use another username for this operation",
    });
  }
}

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
      action: "Use another email to this operation",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashPassword;
}
const user = { create, update, findOneByID, findOneByUsername, findOneByEmail };

export default user;
