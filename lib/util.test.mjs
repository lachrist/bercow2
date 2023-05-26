import { equal as assertEqual, deepEqual as assertDeepEqual } from "node:assert/strict";
import { isNotNull, isNotEmpty, removeDuplicate } from "./util.mjs"

assertEqual(isNotNull(null), false);
assertEqual(isNotNull(undefined), true);

assertEqual(isNotEmpty([]), false);
assertEqual(isNotEmpty([1]), true);

assertDeepEqual(removeDuplicate([1, 2, 2, 3, 3, 3]), [1, 2, 3]);
