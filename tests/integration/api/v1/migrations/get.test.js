import { removeRequestMeta } from "next/dist/server/request-meta";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET to /ap1/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You're not allowed to do this action",
        status_code: 403,
        action: "Verify if user have feature:read:migration",
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const defaultUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(defaultUser);
      const sessionObj = await orchestrator.createSession(activatedUser.id);
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: { Cookie: `session_id=${sessionObj.token}` },
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You're not allowed to do this action",
        status_code: 403,
        action: "Verify if user have feature:read:migration",
      });
    });
  });

  describe("Privileged user", () => {
    test("Retrieving pending migrations", async () => {
      const defaultUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(defaultUser);
      await orchestrator.addFeatures(activatedUser.id, ["read:migration"]);
      const sessionObj = await orchestrator.createSession(activatedUser.id);
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: { Cookie: `session_id=${sessionObj.token}` },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
