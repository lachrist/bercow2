import { deepEqual as assertEqual } from "node:assert/strict";
import {
  partialX_,
  partial_X,
  partialXX_,
} from "./partial.mjs";

/**
 * @template X
 * @param {X[]} args
 * @returns {X[]}
 */
const collectArguments = (...args) => args;

assertEqual(partialX_(collectArguments, 1)(2), [1, 2]);

assertEqual(partial_X(collectArguments, 2)(1), [1, 2]);

assertEqual(partialXX_(collectArguments, 1, 2)(3), [1,2,3]);
