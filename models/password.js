import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRounds();
  return await bcryptjs.hash(addPepper(password), rounds);
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(addPepper(providedPassword), storedPassword);
}

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

function addPepper(password) {
  const passwordPepper = process.env.PASSWORD_PEPPER || "";
  return password.concat(passwordPepper);
}

const password = { hash, compare };

export default password;
