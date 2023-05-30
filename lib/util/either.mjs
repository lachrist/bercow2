/**
 * @template A, B
 * @param {A} left
 * @return {Either<A, B>}
 */
export const makeLeft = (left) => ({
  type: "left",
  left,
});

/**
 * @template A, B
 * @param {B} right
 * @return {Either<A, B>}
 */
export const makeRight = (right) => ({
  type: "right",
  right,
});

/**
 * @template A, B
 * @param {Either<A, B>} either
 * @return {A}
 */
export const fromLeft = (either) => {
  if (either.type === "left") {
    return either.left;
  } else {
    throw new Error("expected left either");
  }
};

/**
 * @template A, B
 * @param {Either<A, B>} either
 * @return {B}
 */
export const fromRight = (either) => {
  if (either.type === "right") {
    return either.right;
  } else {
    throw new Error("expected right either");
  }
};

/**
 * @template A, B
 * @param {Either<A, B>} either
 * @return {boolean}
 */
export const isLeft = ({ type }) => type === "left";

/**
 * @template A, B
 * @param {Either<A, B>} either
 * @return {boolean}
 */
export const isRight = ({ type }) => type === "right";

/**
 * @template A, B, C
 * @param {function(A): C} transformLeft
 * @param {Either<A, B>} either
 * @return {Either<C, B>}
 */
export const mapLeft = (transformLeft, either) => {
  if (either.type === "left") {
    return { type: "left", left: transformLeft(either.left) };
  } else {
    return either;
  }
};

/**
 * @template A, B, C
 * @param {function(B): C} transformRight
 * @param {Either<A, B>} either
 * @return {Either<A, C>}
 */
export const mapRight = (transformRight, either) => {
  if (either.type === "right") {
    return { type: "right", right: transformRight(either.right) };
  } else {
    return either;
  }
};

/**
 * @template A, B, C, D
 * @param {function(A): C} transformLeft
 * @param {function(B): D} transformRight
 * @param {Either<A, B>} either
 * @return {Either<C, D>}
 */
export const mapEither = (transformLeft, transformRight, either) => {
  if (either.type === "left") {
    return { type: "left", left: transformLeft(either.left) };
  } else if (either.type === "right") {
    return { type: "right", right: transformRight(either.right) };
  } else {
    throw new Error("expected either type");
  }
}

/**
 * @template A, B
 * @param {Either<Promise<A>, Promise<B>>} either
 * @return {Promise<Either<A, B>>}
 */
export const awaitEither = async (either) => {
  if (either.type === "left") {
    return {
      type: "left",
      left: await either.left,
    };
  } else if (either.type === "right") {
    return {
      type: "right",
      right: await either.right,
    };
  } else {
    throw new Error("expected either type");
  }
}

/**
 * @template A, B, C
 * @param {function(A): C} recoverLeft
 * @param {function(B): C} recoverRight
 * @param {Either<A, B>} either
 * @return {C}
 */
export const fromEither = (recoverLeft, recoverRight, either) => {
  if (either.type === "left") {
    return recoverLeft(either.left);
  } else if (either.type === "right") {
    return recoverRight(either.right);
  } else {
    throw new Error("expected either type");
  }
}

/**
 * @template A, B
 * @param {Either<A, B>[]} eithers
 * @return {Either<A[], B[]>}
 */
export const splitLeftBias = (eithers) => {
  if (eithers.every(isRight)) {
    return makeRight(eithers.map(fromRight));
  } else {
    return makeLeft(eithers.filter(isLeft).map(fromLeft));
  }
};

/**
 * @template A, B
 * @param {Either<A, B>[]} eithers
 * @return {Either<A[], B[]>}
 */
export const splitRightBias = (eithers) => {
  if (eithers.every(isLeft)) {
    return makeLeft(eithers.map(fromLeft));
  } else {
    return makeRight(eithers.filter(isRight).map(fromRight));
  }
};

/**
 * @template A, B, C
 * @param {Either<A, B>} either
 * @param {function(A): Either<C, B>} bind
 * @return {Either<C, B>}
 */
export const bindLeft = (either, bind) => {
  if (either.type === "left") {
    return bind(either.left);
  } else {
    return either;
  }
};

/**
 * @template A, B, C
 * @param {Either<A, B>} either
 * @param {(b: B) => Either<A, C>} bind
 * @return {Either<A, C>}
 */
export const bindRight = (either, bind) => {
  if (either.type === "right") {
    return bind(either.right);
  } else {
    return either;
  }
};

/**
 * @template A, B, C
 * @param {Either<A, B>} either
 * @param {(a: A) => Promise<Either<C, B>>} bindAsync
 * @return {Promise<Either<C, B>>}
 */
export const bindLeftAsync = (either, bindAsync) => {
  if (either.type === "left") {
    return bindAsync(either.left);
  } else {
    return Promise.resolve(either);
  }
};

/**
 * @template A, B, C
 * @param {Either<A, B>} either
 * @param {(b: B) => Promise<Either<A, C>>} bindAsync
 * @return {Promise<Either<A, C>>}
 */
export const bindRightAsync = (either, bindAsync) => {
  if (either.type === "right") {
    return bindAsync(either.right);
  } else {
    return Promise.resolve(either);
  }
};
