import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("DELETE to /ap1/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Trying DELETE (Method Not Allowed) to migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "DELETE",
      });
      expect(response.status).toBe(405);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "Method not allowed to this endpoint",
        action: "Verify if the method HTTP sended is allowed to this endpoint",
        status_code: 405,
      });
    });
  });
});
