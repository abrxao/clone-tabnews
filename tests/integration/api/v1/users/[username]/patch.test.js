import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH to /ap1/v1/users", () => {
  describe("Anonymous user", () => {
    test("With nonexistent user", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/non_existent",
        { method: "PATCH" },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Requested username was not founded",
        action: "Verify if requested username is right",
        status_code: 404,
      });
    });

    test("With duplicated username", async () => {
      await orchestrator.createUser({
        username: "user1",
      });
      await orchestrator.createUser({
        username: "user2",
      });

      const response1 = await fetch(
        "http://localhost:3000/api/v1/users/user2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "user1",
          }),
        },
      );
      expect(response1.status).toBe(400);
      const response1Body = await response1.json();

      expect(response1Body).toEqual({
        name: "ValidationError",
        message: "This username is already been used",
        action: "Use another username for this operation",
        status_code: 400,
      });
    });

    test("With duplicated email", async () => {
      const newUser = await orchestrator.createUser({
        email: "user1@gmail.com",
      });
      await orchestrator.createUser({
        email: "user2@gmail.com",
      });
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${newUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "user2@gmail.com",
          }),
        },
      );
      expect(response.status).toBe(400);
      const response1Body = await response.json();

      expect(response1Body).toEqual({
        name: "ValidationError",
        message: "This email is already been used",
        action: "Use another email to this operation",
        status_code: 400,
      });
    });

    test("With unique username", async () => {
      await orchestrator.createUser({
        username: "unique_user1",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/unique_user1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "unique_user2",
          }),
        },
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "unique_user2",
        email: responseBody.email,
        password: responseBody.password,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.created_at <= responseBody.updated_at).toBe(true);
    });

    test("With unique email", async () => {
      const newUser = await orchestrator.createUser({
        email: "unique_email1@gmail.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${newUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "unique_email2@gmail.com",
          }),
        },
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: responseBody.username,
        email: "unique_email2@gmail.com",
        password: responseBody.password,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.created_at <= responseBody.updated_at).toBe(true);
    });

    test("With new password", async () => {
      const newUser = await orchestrator.createUser({
        username: "new_password1",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${newUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "newPassword",
          }),
        },
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: newUser.username,
        email: newUser.email,
        password: responseBody.password,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.created_at <= responseBody.updated_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(newUser.username);
      const isCorrectPassword = await password.compare(
        "newPassword",
        userInDatabase.password,
      );
      expect(isCorrectPassword).toBe(true);

      const isWrongPassword = await password.compare(
        "notRightPassword",
        userInDatabase.password,
      );
      expect(isWrongPassword).toBe(false);
    });
  });
});
