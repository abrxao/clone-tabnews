import authorization from "models/authorization";
import { InternalServerError } from "infra/errors";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      expect(() => {
        const createdUser = {
          username: "userWithoutFeatures",
        };
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("with unknown `feature`", () => {
      expect(() => {
        const createdUser = {
          username: "userWithUnknownFeature",
          features: ["unknown:feature"],
        };
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("with valid `user` and known `feature`", () => {
      const createdUser = {
        username: "user",
        features: ["create:user"],
      };
      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      expect(() => {
        const createdUser = {
          username: "userWithoutFeatures",
        };
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("with unknown `feature`", () => {
      expect(() => {
        const createdUser = {
          username: "userWithUnknownFeature",
          features: ["unknown:feature"],
        };
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` and `resource`", () => {
      const createdUser = {
        features: ["create:user"],
      };
      const resource = {
        id: 1,
        email: "resource@resource.com",
        password: "password",
        username: "resource",
        features: ["read:user"],
        created_at: "2026-0101T00:00:00.000Z",
        updated_at: "2026-0101T00:00:00.000Z",
      };

      const result = authorization.filterOutput(
        createdUser,
        "read:user",
        resource,
      );

      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-0101T00:00:00.000Z",
        updated_at: "2026-0101T00:00:00.000Z",
      });
    });

    test("with valid `user`, known `feature` but no `resource`", () => {
      const createdUser = {
        features: ["create:user"],
      };

      expect(() =>
        authorization.filterOutput(createdUser, "read:user"),
      ).toThrow(InternalServerError);
    });
  });
});
