import { deepEqual as assertEqual, throws as assertThrow } from "node:assert/strict";
import {
  makeJust,
  nothing,
  isJust,
  isNothing,
  fromJust,
  mapJust,
  concatMaybe,
  sequenceMaybe,
  findMaybe,
  fromMaybe,
  toMaybe,
} from "./maybe.mjs";

// basic just //
assertEqual(isJust(makeJust(123)), true);
assertEqual(isJust(nothing), false);
assertEqual(isNothing(nothing), true);

// basic nothing //
assertEqual(isNothing(makeJust(123)), false);
assertEqual(fromJust(makeJust(123)), 123);
assertThrow(() => fromJust(nothing));

// map //
assertEqual(
  mapJust(makeJust(123), (x) => x + 1),
  makeJust(124)
);
assertEqual(
  mapJust(nothing, (_x) => 456),
  nothing,
);

// concat //
assertEqual(
  concatMaybe([makeJust(123), nothing, makeJust(456)]),
  [123, 456],
);

// sequenceMaybe //
assertEqual(
  sequenceMaybe([makeJust(123), nothing, makeJust(456)]),
  nothing,
);
assertEqual(
  sequenceMaybe([makeJust(123), makeJust(456)]),
  makeJust([123, 456]),
);

// fromMaybe //
assertEqual(
  fromMaybe(makeJust(123), () => 456, (x) => x + 1),
  124,
);
assertEqual(
  fromMaybe(nothing, () => 123, (_x) => 456),
  123,
);

// toMaybe //
assertEqual(toMaybe(undefined), nothing);
assertEqual(toMaybe(123), makeJust(123));

// findMaybe //
assertEqual(
  findMaybe([1, 2, 3], (x) => x === 2),
  makeJust(2),
);
assertEqual(
  findMaybe([1, 2, 3], (x) => x === 4),
  nothing,
);
