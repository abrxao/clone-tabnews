import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET to /ap1/v1/users", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const newUser = await orchestrator.createUser({
        username: "same_case",
      });
      const response = await fetch(
        `http://localhost:3000/api/v1/users/same_case`,
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "same_case",
        email: newUser.email,
        password: responseBody.password,
        features: [],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("With case mismatch", async () => {
      const newUser = await orchestrator.createUser({
        username: "diff_case",
      });
      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/Diff_Case`,
      );
      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "diff_case",
        email: newUser.email,
        password: response2Body.password,
        features: [],
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });
    });

    test("With nonexistent user", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/non_existent",
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
  });
});
