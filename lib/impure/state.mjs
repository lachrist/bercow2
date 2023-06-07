/**
 * @template S
 * @param {S} value
 * @returns {State<S>}
 */
export const createState = (value) => ({ value });

/**
 * @template S, I, O, F
 * @param {State<S>} state
 * @param {I} input
 * @param {(pair: {
 *   state: S;
 *   input: I;
 * }) => Either<F, { state: S; output: O }>} step
 * @returns {Promise<Either<F, O>>}
 */
export const stepState = async (state, step, input) => {
  const either = step({
    state: state.value,
    input,
  });
  if (either.type === "left") {
    return { type: "left", left: either.left };
  } else if (either.type === "right") {
    state.value = either.right.state;
    return { type: "right", right: either.right.output };
  } else {
    throw new Error("invalid either type");
  }
};

/**
 * @template S
 * @param {State<S>} state
 * @returns {Promise<S>}
 */
export const getState = async ({ value }) => value;

/**
 * @template S
 * @param {State<S>} state
 * @param {S} value
 * @returns {Promise<void>}
 */
export const setState = async (state, value) => {
  state.value = value;
};
