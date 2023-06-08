/** @type {(error: Error) => never} */
export const throwError = (error) => {
  throw error;
};

/**
 * @template X
 * @param {() => X} callback
 * @returns {X | Error}
 */
export const catchError = (callback) => {
  try {
    return callback();
  } catch (error) {
    if (error instanceof Error) {
      return error;
    } else {
      throw new Error("unexpected error type");
    }
  }
};

/**
 * @template X
 * @param {Promise<X>} promise
 * @returns {Promise<X | Error>}
 */
export const catchErrorAsync = async (promise) => {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof Error) {
      return error;
    } else {
      throw new Error("unexpected error type");
    }
  }
};
