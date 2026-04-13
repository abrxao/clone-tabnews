import webserver from "infra/webserver";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET to /ap1/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/status`);
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.updated_at).toBeDefined();

      const parsedDate = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toBe(parsedDate);

      expect(responseBody.dependencies.database.max_connections).toBe(100);
      expect(
        responseBody.dependencies.database.opened_connections,
      ).toBeGreaterThan(0);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const defaultUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(defaultUser);
      const sessionObj = await orchestrator.createSession(activatedUser.id);
      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: { Cookie: `session_id=${sessionObj.token}` },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.updated_at).toBeDefined();

      const parsedDate = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toBe(parsedDate);

      expect(responseBody.dependencies.database.max_connections).toBe(100);
      expect(
        responseBody.dependencies.database.opened_connections,
      ).toBeGreaterThan(0);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Privileged user", () => {
    test("Retrieving pending migrations", async () => {
      const defaultUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(defaultUser);
      await orchestrator.addFeatures(activatedUser.id, ["read:status:all"]);
      const sessionObj = await orchestrator.createSession(activatedUser.id);
      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: { Cookie: `session_id=${sessionObj.token}` },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.updated_at).toBeDefined();

      const parsedDate = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toBe(parsedDate);

      expect(responseBody.dependencies.database.max_connections).toBe(100);
      expect(
        responseBody.dependencies.database.opened_connections,
      ).toBeGreaterThan(0);
      expect(responseBody.dependencies.database.version).toBe("16.0");
    });
  });
});
