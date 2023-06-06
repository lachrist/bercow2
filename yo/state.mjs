/**
 * @template S
 * @param {S} value
 * @returns {State<S>}
 */
export const makeState = (value) => ({ value });

/**
 * @template S, I, O
 * @param {State<S>} state
 * @param {I} input
 * @param {(pair: { state: S; input: I }) => { state: S; output: O }} step
 * @returns {Promise<O>}
 */
export const stepState = async (state, step, input) => {
  const { state: new_state_value, output } = step({
    state: state.value,
    input,
  });
  state.value = new_state_value;
  return output;
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
