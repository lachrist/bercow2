import { deepEqual as assertEqual } from "node:assert/strict";
import {
  pairup,
  getFirst,
  getSecond,
  setFirst,
  setSecond,
  mapFirst,
  mapSecond,
  flip,
  applyFirst,
  applySecond,
  duplicate,
  promiseFirst,
  promiseSecond,
} from "./pair.mjs";

assertEqual(pairup(1, 2), [1, 2]);

assertEqual(getFirst([1, 2]), 1);

assertEqual(getSecond([1, 2]), 2);

assertEqual(setFirst([1, 2], 3), [3, 2]);

assertEqual(setSecond([1, 2], 3), [1, 3]);

assertEqual(
  mapFirst([123, 456], (x) => x + 1),
  [124, 456],
);

assertEqual(
  mapSecond([123, 456], (x) => x + 1),
  [123, 457],
);

assertEqual(flip([1, 2]), [2, 1]);

assertEqual(applyFirst((x) => x + 1, [123, 456]), 124);

assertEqual(applySecond((x) => x + 1, [123, 456]), 457);

assertEqual(duplicate(123), [123, 123]);

assertEqual(await promiseFirst([Promise.resolve(123), 456]), [123, 456]);

assertEqual(await promiseSecond([123, Promise.resolve(456)]), [123, 456]);
