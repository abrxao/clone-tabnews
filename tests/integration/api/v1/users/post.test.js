import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST to /ap1/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const userObj = {
        username: "abrxao",
        email: "abrxao@gmail.com",
        password: "notStrongValue",
      };
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userObj),
      });
      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: userObj.username,
        email: userObj.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername(userObj.username);
      const isCorrectPassword = await password.compare(
        userObj.password,
        userInDatabase.password,
      );
      expect(isCorrectPassword).toBe(true);

      const isWrongPassword = await password.compare(
        "#wrong_password#",
        userInDatabase.password,
      );
      expect(isWrongPassword).toBe(false);
    });

    test("With duplicated email", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicated_email",
          email: "duplicated@gmail.com",
          password: "notStrongValue",
        }),
      });
      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicated_email1",
          email: "Duplicated@gmail.com",
          password: "notStrongValue",
        }),
      });
      expect(response2.status).toBe(400);
      const responseBody = await response2.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "This email is already been used",
        action: "Use another email to this operation",
        status_code: 400,
      });
    });

    test("With duplicated username", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicated_username",
          email: "duplicated_username1@gmail.com",
          password: "notStrongValue",
        }),
      });
      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicated_username",
          email: "duplicated_username2@gmail.com",
          password: "notStrongValue",
        }),
      });
      expect(response2.status).toBe(400);
      const responseBody = await response2.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "This username is already been used",
        action: "Use another username for this operation",
        status_code: 400,
      });
    });
  });
});
