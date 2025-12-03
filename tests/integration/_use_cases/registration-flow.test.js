import activation from "models/activation";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use Case: Registration Flow (all successfull)", () => {
  let createUserResponseBody;
  let emailActivationTokenID;
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

    createUserResponseBody = await createUserResponse.json();
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

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();
    emailActivationTokenID = orchestrator.extractUUID(lastEmail.text);
    const activationToken = await activation.findOneValidByTokenID(
      emailActivationTokenID,
    );

    expect(activationToken.user_id).toBe(createUserResponseBody.id);
    expect(activationToken.used_at).toBe(null);

    expect(lastEmail.sender).toBe("<contact@externbr.com>");
    expect(lastEmail.recipients[0]).toBe("<registrationflow@gmail.com>");
    expect(lastEmail.subject).toBe("Active your account on the ExternBR");
    expect(lastEmail.text).toContain("RegistrationFlow");
    expect(lastEmail.text).toContain(activationToken.id);
  });

  test("Activation account", async () => {
    const activateResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${emailActivationTokenID}`,
      { method: "PATCH" },
    );
    expect(activateResponse.status).toBe(200);
    const activateResponseBody = await activateResponse.json();

    expect(Date.parse(activateResponseBody.used_at)).not.toBeNaN();
    const activatedUser =
      await orchestrator.findOneByUsername("RegistrationFlow");
    expect(activatedUser.features).toEqual(["create:session"]);
  });

  test("Login", async () => {});

  test("Get user information", async () => {});
});
