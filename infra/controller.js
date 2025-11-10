import { MethodNotAllowedError, InternalServerError } from "./errors";

function onErrorHandler(error, _, response) {
  const publicErrorObject = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });
  console.error(error);
  console.log("Error inside of Next-Connect");
  return response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onNoMatchHandler(_, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
