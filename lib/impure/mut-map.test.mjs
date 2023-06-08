import { deepEqual as assertEqual } from "node:assert/strict";
import { makeJust, nothing } from "../util/maybe.mjs";
import {
  createMutMap,
  hasMutMap,
  getMutMap,
  setMutMap,
  cacheMutMap,
  snapshotMutMap
} from "./mut-map.mjs";

/** @type {MutMap<string, number>} */
const mutmap = createMutMap(new Map([["a", 1], ["b", 2]]));

assertEqual(await hasMutMap(mutmap, "a"), true);
assertEqual(await hasMutMap(mutmap, "c"), false);
assertEqual(await getMutMap(mutmap, "a"), makeJust(1));
assertEqual(await getMutMap(mutmap, "c"), nothing);
assertEqual(await setMutMap(mutmap, "c", 3), undefined);
assertEqual(await getMutMap(mutmap, "c"), makeJust(3));
assertEqual(await cacheMutMap(mutmap, "d", () => 4), 4);
assertEqual(await cacheMutMap(mutmap, "d", () => 5), 4);
assertEqual(await getMutMap(mutmap, "d"), makeJust(4));
assertEqual(await snapshotMutMap(mutmap), new Map([["a", 1], ["b", 2], ["c", 3], ["d", 4]]));
