import { deepEqual as assertEqual } from "node:assert/strict";
import { createState, getState, setState, stepState } from "./state.mjs";

const state = createState(123);

assertEqual(await getState(state), 123);

assertEqual(await setState(state, 456), undefined);

assertEqual(await getState(state), 456);

assertEqual(
  await stepState(
    state,
    ({ state, input }) => {
      assertEqual(state, 456);
      assertEqual(input, "input");
      return {
        state: 789,
        output: "output",
      };
    },
    "input"
  ),
  "output"
);

assertEqual(await getState(state), 789);
