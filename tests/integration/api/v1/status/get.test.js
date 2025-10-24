test("GET to /ap1/v1/status should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const body = await response.json();

  expect(body.updated_at).toBeDefined();

  const parsedDate = new Date(body.updated_at).toISOString();
  expect(body.updated_at).toBe(parsedDate);

  expect(body.dependencies.database.max_connections).toBe(100);
  expect(body.dependencies.database.version).toBe("16.0");
  expect(body.dependencies.database.opened_connections).toBeGreaterThan(0);
});
