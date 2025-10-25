import { Client } from "pg";

async function query(queryObject) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.NODE_ENV !== "development",
  });
  try {
    await client.connect();
    const response = await client.query(queryObject);
    return response;
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await client.end();
  }
}

export default { query: query };
