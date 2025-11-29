import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "ExternBR <contact@externbr.com>",
      to: "abraao@gmail.com",
      subject: "Subject test",
      text: "Body test.",
    });

    await email.send({
      from: "ExternBR <contact@externbr.com>",
      to: "abraao@gmail.com",
      subject: "Last sended email",
      text: "Body of last sended email.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contact@externbr.com>");
    expect(lastEmail.recipients[0]).toBe("<abraao@gmail.com>");
    expect(lastEmail.subject).toBe("Last sended email");
    expect(lastEmail.text).toBe("Body of last sended email.\n");
  });
});
