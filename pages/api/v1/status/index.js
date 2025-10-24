import database from "../../../../infra/database.js";
async function status(req, response) {
  const result = await database.query("SELECT 1 + 1 as sum;");
  console.log(result.rows);
  response.status(200).json({ msg_crn: "tiamo" });
}

export default status;
