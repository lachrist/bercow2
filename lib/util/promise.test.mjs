import { deepEqual as assertEqual } from "node:assert/strict";
import { allPromise, resolvePromise } from "./promise.mjs";

assertEqual(await resolvePromise(123), 123);

assertEqual(await allPromise([Promise.resolve(123), Promise.resolve(456)]), [123, 456]);
