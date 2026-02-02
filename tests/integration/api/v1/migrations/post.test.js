import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST to /ap1/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );
        expect(response.status).toBe(403);

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          name: "ForbiddenError",
          message: "You're not allowed to do this action",
          status_code: 403,
          action: "Verify if user have feature:create:migration",
        });
      });
    });
  });
  describe("Default user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const defaultUser = await orchestrator.createUser();
        const activatedUser = await orchestrator.activateUser(defaultUser);
        const sessionObj = await orchestrator.createSession(activatedUser.id);
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
            headers: { Cookie: `session_id=${sessionObj.token}` },
          },
        );
        expect(response.status).toBe(403);

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          name: "ForbiddenError",
          message: "You're not allowed to do this action",
          status_code: 403,
          action: "Verify if user have feature:create:migration",
        });
      });
    });
  });

  describe("Privileged user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const defaultUser = await orchestrator.createUser();
        const activatedUser = await orchestrator.activateUser(defaultUser);
        await orchestrator.addFeatures(activatedUser.id, ["create:migration"]);
        const sessionObj = await orchestrator.createSession(activatedUser.id);
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
            headers: { Cookie: `session_id=${sessionObj.token}` },
          },
        );
        expect(response.status).toBe(200);
        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
      });
    });
  });
});
