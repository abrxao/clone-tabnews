import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator";
import user from "models/user";
import { faker } from "@faker-js/faker";
import session from "models/session";
import activation from "models/activation";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (response.status !== 200) {
        throw Error({ error: "Orchestration Error" });
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailPage() {
      const response = await fetch(emailHttpUrl);
      if (response.status !== 200) {
        throw Error({ error: "Orchestration Error" });
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObj) {
  return await user.create({
    username:
      userObj.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObj.email || faker.internet.email(),
    password: userObj.password || "validPassword",
  });
}

async function activatedUser(userObj) {
  return await activation.activateUserByUserID(userObj.id);
}

async function findOneByUsername(username) {
  return await user.findOneByUsername(username);
}

async function createSession(userID) {
  return await session.create(userID);
}

async function deleteAllEmails() {
  await fetch(`${emailHttpUrl}/messages`, {
    method: "DELETE",
  });
}

function extractUUID(text) {
  const match = text.match(/[0-9a-fA-F-]{36}/);
  return match ? match[0] : null;
}

async function getLastEmail() {
  const response = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = await response.json();
  const lastEmailItem = emailListBody.pop();
  if (!lastEmailItem) {
    return null;
  }

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  );
  const emailTextBody = await emailTextResponse.text();
  lastEmailItem.text = emailTextBody;
  return lastEmailItem;
}

const orchestrator = {
  clearDatabase,
  activatedUser,
  createUser,
  createSession,
  deleteAllEmails,
  extractUUID,
  findOneByUsername,
  getLastEmail,
  runPendingMigrations,
  waitForAllServices,
};
export default orchestrator;
