export class InternalServerError extends Error {
  constructor({ cause }) {
    super("A unexpected Internal Error ocurred", { cause });
    this.name = "InternalServerError";
    this.action = "Contact support";
    this.statusCode = 500;
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
