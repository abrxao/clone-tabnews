import session from "models/session";
import orchestrator from "tests/orchestrator";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE to /ap1/v1/sessions", () => {
  describe("Default user", () => {
    test("With nonexistent Session", async () => {
      const nonExistentCode =
        "fef163721e683af840a627bb7dd20babd30d64e535f96823967182058ecfadc450141fc42b8f31eb4dc702fe60a95498";

      const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${nonExistentCode}`,
        },
      });
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: "User session not valid",
        action: "Verify if user is logged and try again",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MS),
      });
      const newUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });
      const sessionObject = await orchestrator.createSession(newUser.id);
      jest.useRealTimers();

      const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(401);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: "User session not valid",
        action: "Verify if user is logged and try again",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    test("With valid Session", async () => {
      const newUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });
      const sessionObject = await orchestrator.createSession(newUser.id);
      const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: sessionObject.id,
        token: sessionObject.token,
        user_id: sessionObject.user_id,
        created_at: responseBody.created_at,
        expires_at: responseBody.expires_at,
        updated_at: responseBody.updated_at,
      });

      expect(
        responseBody.expires_at < sessionObject.expires_at.toISOString(),
      ).toBe(true);
      expect(
        responseBody.updated_at > sessionObject.updated_at.toISOString(),
      ).toBe(true);

      const parsedSetCookie = setCookieParser(response, { map: true });
      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });

      const doubleCheckResponse = await fetch(
        "http://localhost:3000/api/v1/user",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(doubleCheckResponse.status).toBe(401);
      const responseDoubleCheck = await doubleCheckResponse.json();

      expect(responseDoubleCheck).toEqual({
        message: "User session not valid",
        action: "Verify if user is logged and try again",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });
  });
});
