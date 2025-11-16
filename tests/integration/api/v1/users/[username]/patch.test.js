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
        { method: "PATCH", body: JSON.stringify({}) },
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
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
          email: "user1@gmail.com",
          password: "notStrongValue",
        }),
      });
      expect(user1Response.status).toBe(201);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user2",
          email: "user2@gmail.com",
          password: "notStrongValue",
        }),
      });
      expect(user2Response.status).toBe(201);

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
      const response1 = await fetch(
        "http://localhost:3000/api/v1/users/user2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "user1@gmail.com",
          }),
        },
      );
      expect(response1.status).toBe(400);
      const response1Body = await response1.json();

      expect(response1Body).toEqual({
        name: "ValidationError",
        message: "This email is already been used",
        action: "Use another email to this operation",
        status_code: 400,
      });
    });

    test("With unique username", async () => {
      const userObj = {
        username: "unique_user1",
        email: "unique_user1@gmail.com",
        password: "notStrongValue",
      };
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userObj),
      });
      expect(user1Response.status).toBe(201);

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
        email: userObj.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.created_at < responseBody.updated_at).toBe(true);
    });

    test("With unique email", async () => {
      const userObj = {
        username: "unique_email1",
        email: "unique_email1@gmail.com",
        password: "notStrongValue",
      };
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userObj),
      });
      expect(user1Response.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/unique_email1",
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
        username: userObj.username,
        email: "unique_email2@gmail.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.created_at < responseBody.updated_at).toBe(true);
    });

    test("With new password", async () => {
      const userObj = {
        username: "new_password1",
        email: "new_password1@gmail.com",
        password: "notStrongValue",
      };
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userObj),
      });
      expect(user1Response.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/new_password1",
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
        username: userObj.username,
        email: userObj.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.created_at < responseBody.updated_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(userObj.username);
      const isCorrectPassword = await password.compare(
        "newPassword",
        userInDatabase.password,
      );
      expect(isCorrectPassword).toBe(true);

      const isWrongPassword = await password.compare(
        "notStrongValue",
        userInDatabase.password,
      );
      expect(isWrongPassword).toBe(false);
    });
  });
});
