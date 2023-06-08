/**
 * @template A, B
 * @param {A} left
 * @returns {Either<A, B>}
 */
export const makeLeft = (left) => ({ left });

/**
 * @template A, B
 * @param {B} right
 * @returns {Either<A, B>}
 */
export const makeRight = (right) => ({ right });

/**
 * @template A, B
 * @param {Either<A, B>} either
 * @returns {A}
 */
export const fromLeft = (either) => {
  if ("left" in either) {
    return either.left;
  } else {
    throw new Error("expected left either");
  }
};

/**
 * @template A, B
 * @param {Either<A, B>} either
 * @returns {B}
 */
export const fromRight = (either) => {
  if ("right" in either) {
    return either.right;
  } else {
    throw new Error("expected right either");
  }
};

/**
 * @template A, B
 * @param {Either<A, B>} either
 * @returns {boolean}
 */
export const isLeft = (either) => "left" in either;

/**
 * @template A, B
 * @param {Either<A, B>} either
 * @returns {boolean}
 */
export const isRight = (either) => "right" in either;

/**
 * @template A, B, C
 * @param {Either<A, B>} either
 * @param {(a: A) => C} transformLeft
 * @returns {Either<C, B>}
 */
export const mapLeft = (either, transformLeft) => {
  if ("left" in either) {
    return { left: transformLeft(either.left) };
  } else {
    return either;
  }
};

/**
 * @template A, B, C
 * @param {Either<A, B>} either
 * @param {(b: B) => C} transformRight
 * @returns {Either<A, C>}
 */
export const mapRight = (either, transformRight) => {
  if ("right" in either) {
    return { right: transformRight(either.right) };
  } else {
    return either;
  }
};

/**
 * @template A, B, C, D
 * @param {Either<A, B>} either
 * @param {(a: A) => C} transformLeft
 * @param {(b: B) => D} transformRight
 * @returns {Either<C, D>}
 */
export const mapEither = (either, transformLeft, transformRight) => {
  if ("left" in either) {
    return { left: transformLeft(either.left) };
  } else if ("right" in either) {
    return { right: transformRight(either.right) };
  } /* c8 ignore start */ else {
    throw new Error("expected either type");
  } /* c8 ignore stop */
};

// /**
//  * @template A, B
//  * @param {Either<Promise<A>, Promise<B>>} either
//  * @returns {Promise<Either<A, B>>}
//  */
// export const awaitEither = async (either) => {
//   if (either.type === "left") {
//     return {
//       type: "left",
//       left: await either.left,
//     };
//   } else if (either.type === "right") {
//     return {
//       type: "right",
//       right: await either.right,
//     };
//   } else {
//     throw new Error("expected either type");
//   }
// };

/**
 * @template A, B, C
 * @param {Either<A, B>} either
 * @param {(a: A) => C} recoverLeft
 * @param {(b: B) => C} recoverRight
 * @returns {C}
 */
export const fromEither = (either, recoverLeft, recoverRight) => {
  if ("left" in either) {
    return recoverLeft(either.left);
  } else if ("right" in either) {
    return recoverRight(either.right);
  } /* c8 ignore start */ else {
    throw new Error("expected either type");
  } /* c8 ignore stop */
};

/**
 * @template A, B
 * @param {Either<A, B>[]} eithers
 * @returns {Either<[A, ...A[]], B[]>}
 */
export const splitLeftBias = (eithers) => {
  if (eithers.every(isRight)) {
    return makeRight(eithers.map(fromRight));
  } else {
    return makeLeft(
      /** @type {[A, ...A[]]} */ (eithers.filter(isLeft).map(fromLeft))
    );
  }
};

/**
 * @template A, B
 * @param {Either<A, B>[]} eithers
 * @returns {Either<A[], [B, ...B[]]>}
 */
export const splitRightBias = (eithers) => {
  if (eithers.every(isLeft)) {
    return makeLeft(eithers.map(fromLeft));
  } else {
    return makeRight(
      /** @type {[B, ...B[]]} */ (eithers.filter(isRight).map(fromRight))
    );
  }
};

/**
 * @template A, B, C
 * @param {Either<A, B>} either
 * @param {(a: A) => Either<C, B>} bind
 * @returns {Either<C, B>}
 */
export const bindLeft = (either, bind) => {
  if ("left" in either) {
    return bind(either.left);
  } else {
    return either;
  }
};

/**
 * @template A, B, C
 * @param {Either<A, B>} either
 * @param {(b: B) => Either<A, C>} bind
 * @returns {Either<A, C>}
 */
export const bindRight = (either, bind) => {
  if ("right" in either) {
    return bind(either.right);
  } else {
    return either;
  }
};

// /**
//  * @template A, B
//  * @param {Either<Promise<A>, Promise<B>>} either}
//  * @returns {Promise<Either<A, B>>}
//  */
// export const promiseEither = async (either) => {
//   if (either.type === "left") {
//     return {type: "left", left: await either.left};
//   } else if (either.type === "right") {
//     return {type: "right", right: await either.right};
//   } else {
//     throw new Error("expected either type");
//   }
// };

/**
 * @template A, B, C
 * @param {Either<A, B>} either
 * @param {(a: A) => Promise<Either<C, B>>} bindAsync
 * @returns {Promise<Either<C, B>>}
 */
export const bindLeftAsync = async (either, bindAsync) => {
  if ("left" in either) {
    return await bindAsync(either.left);
  } else {
    return either;
  }
};

/**
 * @template A, B, C
 * @param {Either<A, B>} either
 * @param {(b: B) => Promise<Either<A, C>>} bindAsync
 * @returns {Promise<Either<A, C>>}
 */
export const bindRightAsync = async (either, bindAsync) => {
  if ("right" in either) {
    return await bindAsync(either.right);
  } else {
    return either;
  }
};

/**
 * @template X
 * @param {() => X} callback
 * @returns {Either<Error, X>}
 */
export const catchEither = (callback) => {
  try {
    return makeRight(callback());
  } catch (error) {
    if (error instanceof Error) {
      return { left: error };
    } else {
      throw error;
    }
  }
};

/**
 * @template X
 * @param {Promise<X>} promise
 * @returns {Promise<Either<Error, X>>}
 */
export const catchEitherAsync = async (promise) => {
  try {
    return { right: await promise };
  } catch (error) {
    if (error instanceof Error) {
      return { left: error };
    } else {
      throw error;
    }
  }
};

/**
 * @template V
 * @param {Error | V} union
 * @returns {Either<Error, V>}
 */
export const toEither = (union) => {
  if (union instanceof Error) {
    return { left: union };
  } else {
    return { right: union };
  }
};
