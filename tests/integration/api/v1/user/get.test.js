import session from "models/session";
import orchestrator from "tests/orchestrator";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET to /ap1/v1/user", () => {
  describe("Default user", () => {
    test("With valid Session", async () => {
      const newUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });
      const sessionObject = await orchestrator.createSession(newUser.id);
      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: newUser.username,
        email: newUser.email,
        password: responseBody.password,
        created_at: new Date(newUser.created_at).toISOString(),
        updated_at: new Date(newUser.updated_at).toISOString(),
      });

      // Session Renew Assertions
      jest.useFakeTimers({
        now: new Date(Date.now() + parseInt(session.EXPIRATION_IN_MS / 2)), //go to 15 days ahead
      });
      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );
      expect(
        renewedSessionObject.expires_at > sessionObject.expires_at,
      ).toEqual(true);
      expect(
        renewedSessionObject.updated_at > sessionObject.updated_at,
      ).toEqual(true);

      // Set-Cookie Assertions
      const parsedSetCookie = setCookieParser(response, { map: true });
      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: session.EXPIRATION_IN_MS / 1000, //30 Days in seconds
        path: "/",
        httpOnly: true,
      });
      jest.useRealTimers();
    });

    test("With nonexistent Session", async () => {
      const nonExistentCode =
        "fef163721e683af840a627bb7dd20babd30d64e535f96823967182058ecfadc450141fc42b8f31eb4dc702fe60a95498";

      const response = await fetch(`http://localhost:3000/api/v1/user`, {
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
      const response = await fetch(`http://localhost:3000/api/v1/user`, {
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
  });
});
