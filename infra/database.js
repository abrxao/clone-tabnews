import { Client } from "pg";
import { ServiceError } from "./errors";

async function query(queryObject) {
  let client;
  try {
    client = await getNewClient();
    const response = await client.query(queryObject);
    return response;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Connection or Query Error",
      cause: error,
    });
    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}
const database = { query, getNewClient };
export default database;

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }

  return process.env.NODE_ENV === "production";
}

async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
  });
  await client.connect();
  return client;
}
