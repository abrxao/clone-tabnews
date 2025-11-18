export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("A unexpected Internal Error ocurred", { cause });
    this.name = "InternalServerError";
    this.action = "Contact support";
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status_code: this.statusCode,
      action: this.action,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Method not allowed to this endpoint");
    this.name = "MethodNotAllowedError";
    this.message = "Method not allowed to this endpoint";
    this.action =
      "Verify if the method HTTP sended is allowed to this endpoint";

    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status_code: this.statusCode,
      action: this.action,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "Indisponible Service at moment.", { cause });
    this.name = "ServiceError";
    this.action = "Verify if service is disponible";
    this.statusCode = 503;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status_code: this.statusCode,
      action: this.action,
    };
  }
}

export class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "A Validation Error Occurs", { cause });
    this.name = "ValidationError";
    this.action = action || "Adjust the sended data and try again";
    this.statusCode = 400;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status_code: this.statusCode,
      action: this.action,
    };
  }
}

export class NotFoundError extends Error {
  constructor({ cause, message, action }) {
    super(message || "It was not possible to found this resource", { cause });
    this.name = "NotFoundError";
    this.action = action || "Verify if the parameters in query are right";
    this.statusCode = 404;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status_code: this.statusCode,
      action: this.action,
    };
  }
}

export class UnauthorizedError extends Error {
  constructor({ cause, message, action }) {
    super(message || "User not authenticated", { cause });
    this.name = "UnauthorizedError";
    this.action = action || "Login again to continue with this action";
    this.statusCode = 401;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status_code: this.statusCode,
      action: this.action,
    };
  }
}
