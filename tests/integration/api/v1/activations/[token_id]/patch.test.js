import { version as uuidVersion } from "uuid";
import activation from "models/activation";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH to /ap1/v1/activations", () => {
  describe("Anonymous user", () => {
    test("With nonexistent activation token", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/activations/1ea6d6e1-93ba-4ea8-82e3-91810b133492",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect(response.status).toBe(404);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        action: "Do a new register",
        message: "Activation token not exist or expired",
        status_code: 404,
      });
    });
    test("With expired activation token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MS),
      });
      const createUserResponse = await orchestrator.createUser({});
      const expiredActivationToken = await activation.create(
        createUserResponse.id,
      );
      jest.useRealTimers();

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect(response.status).toBe(404);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Activation token not exist or expired",
        action: "Do a new register",
        status_code: 404,
      });
    });
    test("With token already used", async () => {
      const createUserResponse = await orchestrator.createUser({});
      const activationToken = await activation.create(createUserResponse.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect(response.status).toBe(200);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect(response2.status).toBe(404);
      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "NotFoundError",
        message: "Activation token not exist or expired",
        action: "Do a new register",
        status_code: 404,
      });
    });
    test("With valid activation token", async () => {
      const createUserResponse = await orchestrator.createUser({});
      const activationToken = await activation.create(createUserResponse.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: activationToken.id,
        user_id: createUserResponse.id,
        used_at: responseBody.used_at,
        expires_at: activationToken.expires_at.toISOString(),
        created_at: activationToken.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);

      expect(Date.parse(responseBody.used_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(activationToken.created_at);
      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt.getTime() - createdAt.getTime()).toBe(
        activation.EXPIRATION_IN_MS,
      );

      const activatedUser = await orchestrator.findOneByUsername(
        createUserResponse.username,
      );
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
      ]);
    });
    test("With valid token but already activated user", async () => {
      const createUserResponse = await orchestrator.createUser({});
      await orchestrator.activateUser(createUserResponse);
      const activationToken = await activation.create(createUserResponse.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect(response.status).toBe(403);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You cannot activate an already activated user",
        action: "Contact support if you think this is a mistake",
        status_code: 403,
      });
    });
  });
  describe("Authenticated user", () => {
    test("With valid token, but user is authenticated", async () => {
      const user1 = await orchestrator.createUser({});
      await orchestrator.activateUser(user1);
      const user1SessionObj = await orchestrator.createSession(user1.id);

      const user2 = await orchestrator.createUser();
      const activationToken = await activation.create(user2.id);
      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${user1SessionObj.token}`,
          },
        },
      );
      expect(response.status).toBe(403);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You're not allowed to do this action",
        status_code: 403,
        action: "Verify if user have feature:read:activation_token",
      });
    });
  });
});
