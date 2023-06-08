import { deepEqual as assertEqual } from "node:assert/strict";
import { getHead, toArray, toMap, toSet, unionSet } from "./collection.mjs";

assertEqual(getHead([1, 2, 3]), 1);

assertEqual(toArray([1, 2, 3]), [1, 2, 3]);
assertEqual(toArray(new Set([1, 2, 3])), [1, 2, 3]);

assertEqual(
  toMap([
    ["a", 1],
    ["b", 2],
    ["c", 3],
  ]),
  new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
  ])
);
assertEqual(
  toMap(
    new Map([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ])
  ),
  new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
  ])
);

assertEqual(toSet([1, 2, 3]), new Set([1, 2, 3]));
assertEqual(toSet(new Set([1, 2, 3])), new Set([1, 2, 3]));

assertEqual(
  unionSet([new Set([1, 2, 3]), new Set([2, 3, 4]), new Set([3, 4, 5])]),
  new Set([1, 2, 3, 4, 5])
);
