import { InternalServerError } from "infra/errors";

const availableFeatures = [
  //USER
  "create:user",
  "update:user",
  "update:user:others",
  "read:user",
  "read:user:self",

  //SESSION
  "create:session",
  "read:session",

  //ACTIVATION TOKEN
  "read:activation_token",

  //MIGRATION
  "read:migration",
  "create:migration",

  //STATUS
  "read:status:all",
  "read:status",
];

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);

  let authorizaded = false;

  if (user.features.includes(feature)) {
    authorizaded = true;
  }
  if (feature == "update:user" && resource) {
    authorizaded = false;
    if (user.id == resource.id || can(user, "update:user:others", resource)) {
      authorizaded = true;
    }
  }

  return authorizaded;
}

function filterOutput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);
  if (feature == "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }
  if (feature == "read:user:self") {
    if (user.id == resource.id) {
      return {
        id: resource.id,
        email: resource.email,
        username: resource.username,
        features: resource.features,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }
  if (feature == "read:session") {
    if (user.id == resource.user_id) {
      return {
        id: resource.id,
        token: resource.token,
        user_id: resource.user_id,
        created_at: resource.created_at,
        expires_at: resource.expires_at,
        updated_at: resource.updated_at,
      };
    }
  }
  if (feature == "read:activation_token") {
    return {
      id: resource.id,
      user_id: resource.user_id,
      created_at: resource.created_at,
      expires_at: resource.expires_at,
      updated_at: resource.updated_at,
      used_at: resource.used_at,
    };
  }
  if (feature == "read:migration") {
    return resource.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }
  if (feature == "read:status") {
    const statusOutput = {
      updated_at: resource.updated_at,
      dependencies: {
        database: {
          opened_connections: resource.dependencies.database.opened_connections,
          max_connections: resource.dependencies.database.max_connections,
        },
      },
    };

    if (can(user, "read:status:all")) {
      statusOutput.dependencies.database.version =
        resource.dependencies.database.version;
    }
    return statusOutput;
  }
}
function validateFeature(feature) {
  if (!feature || !availableFeatures.includes(feature)) {
    throw new InternalServerError({
      cause: "A known `feature` is needed in `authorization` model.",
    });
  }
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "A known `user` is needed in `authorization` model.",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause: "A known `resource` is needed in `authorization` model.",
    });
  }
}

const authorization = { can, filterOutput };

export default authorization;
