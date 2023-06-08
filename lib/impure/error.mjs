/**
 * @type {(serial: {
 *   name: string;
 *   message: string;
 *   stack: string;
 * }) => Error}
 */
export const instantiateError = ({ name, message, stack }) => {
  const error = new Error();
  error.message = message;
  error.name = name;
  error.stack = stack;
  return error;
};
