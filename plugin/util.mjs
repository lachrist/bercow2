/**
 * @template X
 * @param {(() => X)} callback
 * @return {X | Error}
*/
export const catchError = (callback) => {
  try {
    return callback();
  } catch (error) {
    if (error instanceof Error) {
      return error;
    } else {
      throw error;
    }
  }
};

/**
 * @template X
 * @param {Promise<X>} promise
 * @return {Promise<X | Error>}
*/
export const catchErrorAsync = async (promise) => {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof Error) {
      return error;
    } else {
      throw error;
    }
  }
};
