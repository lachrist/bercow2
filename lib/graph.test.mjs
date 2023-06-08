import { deepEqual as assertEqual } from "node:assert/strict";
import { initializeGraph, stepGraph, isGraphComplete } from "./graph.mjs";
import { fromEither } from "./util/either.mjs";
import { digest } from "./impure/digest.mjs";

/** @type {import("./impure/digest.mjs").DigestOptions} */
const options = {
  algorithm: "sha256",
  input: "utf8",
  output: "hex",
};

/**
 * @typedef {| {
 *       specifier: string;
 *       result: Result;
 *       error: Error;
 *     }
 *   | {
 *       specifier: string;
 *       result: Result;
 *       actions: Action[];
 *     }} Frame
 */

/** @type {(graph: Graph, frame: Frame) => Graph} */
const testStep = (graph, frame) =>
  fromEither(
    stepGraph({
      graph,
      outcome: { specifier: frame.specifier, result: frame.result },
    }),
    (error) => {
      if ("error" in frame) {
        assertEqual(error, frame.error);
        return graph;
      } else {
        throw new Error("expected success");
      }
    },
    (next) => {
      if ("actions" in frame) {
        assertEqual(next.actions, frame.actions);
        return next.graph;
      } else {
        throw new Error("expected failure");
      }
    }
  );

/** @type {(graph: Graph, frames: Frame[], index: number) => Graph} */
const chainStepLoop = (graph, frames, index) => {
  if (index >= frames.length) {
    return graph;
  } else {
    const next_graph = testStep(graph, frames[index]);
    return chainStepLoop(next_graph, frames, index + 1);
  }
};

/** @type {(specifiesr: Specifier[], frames: Frame[]) => Graph} */
const chainStep = (specifiers, frames) => {
  const { graph, actions } = initializeGraph(new Set(specifiers));
  assertEqual(
    actions,
    specifiers.map((specifier) => ({ type: "lint", specifier }))
  );
  return chainStepLoop(graph, frames, 0);
};

/////////////////////////
// Failure Propagation //
/////////////////////////

assertEqual(
  isGraphComplete(
    chainStep(
      ["foo", "bar", "qux"],
      [
        // Lint //
        {
          specifier: "foo",
          result: { type: "lint", inner: { right: "hash-foo" } },
          actions: [{ type: "link", specifier: "foo", hash: "hash-foo" }],
        },
        {
          specifier: "bar",
          result: { type: "lint", inner: { right: "hash-bar" } },
          actions: [{ type: "link", specifier: "bar", hash: "hash-bar" }],
        },
        {
          specifier: "qux",
          result: { type: "lint", inner: { right: "hash-qux" } },
          actions: [{ type: "link", specifier: "qux", hash: "hash-qux" }],
        },
        // Link //
        {
          specifier: "foo",
          result: { type: "link", inner: { right: new Set(["bar"]) } },
          actions: [],
        },
        {
          specifier: "bar",
          result: { type: "link", inner: { right: new Set(["qux"]) } },
          actions: [],
        },
        {
          specifier: "qux",
          result: { type: "link", inner: { left: new Error("error") } },
          actions: [],
        },
      ],
    )
  ),
  true
);

///////////
// Cycle //
///////////

assertEqual(
  isGraphComplete(
    chainStep(
      ["foo", "bar", "qux"],
      [
        // Lint //
        {
          specifier: "foo",
          result: { type: "lint", inner: { right: "hash-foo" } },
          actions: [{ type: "link", specifier: "foo", hash: "hash-foo" }],
        },
        {
          specifier: "bar",
          result: { type: "lint", inner: { right: "hash-bar" } },
          actions: [{ type: "link", specifier: "bar", hash: "hash-bar" }],
        },
        {
          specifier: "qux",
          result: { type: "lint", inner: { right: "hash-qux" } },
          actions: [{ type: "link", specifier: "qux", hash: "hash-qux" }],
        },
        // Link //
        {
          specifier: "foo",
          result: { type: "link", inner: { right: new Set(["bar"]) } },
          actions: [],
        },
        {
          specifier: "bar",
          result: { type: "link", inner: { right: new Set(["qux"]) } },
          actions: [],
        },
        {
          specifier: "qux",
          result: { type: "link", inner: { right: new Set(["foo"]) } },
          actions: [
            {
              type: "test",
              specifier: "foo",
              hash: digest('["hash-bar","hash-foo","hash-qux"]', options),
            },
            {
              type: "test",
              specifier: "bar",
              hash: digest('["hash-bar","hash-foo","hash-qux"]', options),
            },
            {
              type: "test",
              specifier: "qux",
              hash: digest('["hash-bar","hash-foo","hash-qux"]', options),
            },
          ],
        },
        // Test //
        {
          specifier: "foo",
          result: { type: "test", inner: null },
          actions: [],
        },
        {
          specifier: "bar",
          result: { type: "test", inner: null },
          actions: [],
        },
        {
          specifier: "qux",
          result: { type: "test", inner: null },
          actions: [],
        },
      ],
    )
  ),
  true
);
