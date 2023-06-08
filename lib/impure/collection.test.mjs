import { deepEqual as assertEqual } from "node:assert/strict";
import { addSet, insertMap } from "./collection.mjs";

assertEqual(addSet(new Set([1, 2, 3]), 4), new Set([1, 2, 3, 4]));
assertEqual(addSet(new Set([1, 2, 3]), 3), new Set([1, 2, 3]));

assertEqual(
  insertMap(
    new Map([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]),
    "d",
    4
  ),
  new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
    ["d", 4],
  ])
);

assertEqual(
  insertMap(
    new Map([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]),
    "c",
    4
  ),
  new Map([
    ["a", 1],
    ["b", 2],
    ["c", 4],
  ])
);
