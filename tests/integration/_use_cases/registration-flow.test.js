import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use Case: Registration Flow (all successfull)", () => {
  test("Create user account", async () => {
    const userObj = {
      username: "RegistrationFlow",
      email: "registrationflow@gmail.com",
      password: "RegistrationFlow",
    };
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userObj),
      },
    );
    expect(createUserResponse.status).toBe(201);

    const createUserResponseBody = await createUserResponse.json();
    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: userObj.username,
      email: userObj.email,
      password: createUserResponseBody.password,
      features: ["read:activation_token"],
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {});

  test("Activation account", async () => {});

  test("Login", async () => {});

  test("Get user information", async () => {});
});
