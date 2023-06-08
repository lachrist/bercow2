import {
  deepEqual as assertEqual,
  throws as assertThrow,
  rejects as assertReject,
} from "node:assert/strict";
import {
  makeLeft,
  makeRight,
  fromLeft,
  fromRight,
  isLeft,
  isRight,
  mapLeft,
  mapRight,
  mapEither,
  bindLeft,
  bindRight,
  bindLeftAsync,
  bindRightAsync,
  fromEither,
  toEither,
  splitLeftBias,
  splitRightBias,
  catchEither,
  catchEitherAsync,
} from "./either.mjs";

////////////////////////
// make && is && from //
////////////////////////

assertEqual(isLeft(makeLeft(123)), true);
assertEqual(isLeft(makeRight(123)), false);
assertEqual(fromLeft(makeLeft(123)), 123);
assertThrow(() => fromLeft(makeRight(123)), /^Error: expected left either$/);

assertEqual(isRight(makeRight(123)), true);
assertEqual(isRight(makeLeft(123)), false);
assertEqual(fromRight(makeRight(123)), 123);
assertThrow(() => fromRight(makeLeft(123)), /^Error: expected right either$/);

/////////
// map //
/////////

assertEqual(
  mapLeft(makeLeft(123), (x) => x + 1),
  makeLeft(124)
);
assertEqual(
  mapLeft(makeRight(123), (x) => x + 1),
  makeRight(123)
);

assertEqual(
  mapRight(makeRight(123), (x) => x + 1),
  makeRight(124)
);
assertEqual(
  mapRight(makeLeft(123), (x) => x + 1),
  makeLeft(123)
);

assertEqual(
  mapEither(makeLeft(123), (x) => x + 1, (_x) => 456),
  makeLeft(124),
);
assertEqual(
  mapEither(makeRight(123), (_x) => 456, (x) => x + 1),
  makeRight(124),
);

//////////
// bind //
//////////

assertEqual(
  bindLeft(makeLeft(123), (x) => makeLeft(x + 1)),
  makeLeft(124)
);
assertEqual(
  bindLeft(makeRight(123), (x) => makeLeft(x + 1)),
  makeRight(123)
);

assertEqual(
  bindRight(makeRight(123), (x) => makeRight(x + 1)),
  makeRight(124)
);
assertEqual(
  bindRight(makeLeft(123), (x) => makeRight(x + 1)),
  makeLeft(123)
);

assertEqual(
  await bindLeftAsync(makeLeft(123), async (x) => makeLeft(x + 1)),
  makeLeft(124)
);
assertEqual(
  await bindLeftAsync(makeRight(123), async (x) => makeLeft(x + 1)),
  makeRight(123)
);

assertEqual(
  await bindRightAsync(makeRight(123), async (x) => makeRight(x + 1)),
  makeRight(124)
);
assertEqual(
  await bindRightAsync(makeLeft(123), async (x) => makeRight(x + 1)),
  makeLeft(123)
);

///////////////
// splitBias //
///////////////

assertEqual(
  splitLeftBias([makeLeft(123), makeRight(456), makeLeft(789)]),
  makeLeft([123, 789])
);
assertEqual(
  splitLeftBias([makeRight(123), makeRight(456), makeRight(789)]),
  makeRight([123, 456, 789])
);

assertEqual(
  splitRightBias([makeRight(123), makeLeft(456), makeRight(789)]),
  makeRight([123, 789])
);
assertEqual(
  splitRightBias([makeLeft(123), makeLeft(456), makeLeft(789)]),
  makeLeft([123, 456, 789])
);

/////////////////
// catchEither //
/////////////////

assertEqual(
  catchEither(() => 123),
  makeRight(123)
);

assertEqual(
  catchEither(() => {
    throw new Error("error");
  }),
  makeLeft(new Error("error"))
);

assertThrow(() => {
  catchEither(() => {
    throw 123;
  });
});

//////////////////////
// catchEitherAsync //
//////////////////////

assertEqual(await catchEitherAsync(Promise.resolve(123)), makeRight(123));

assertEqual(
  await catchEitherAsync(Promise.reject(new Error("error"))),
  makeLeft(new Error("error"))
);

assertReject(catchEitherAsync(Promise.reject(123)));

//////////////
// toEither //
//////////////

assertEqual(toEither(123), makeRight(123));
assertEqual(toEither(new Error("error")), makeLeft(new Error("error")));

////////////////
// fromEither //
////////////////

assertEqual(fromEither(makeLeft(123), (x) => x + 1, (_x) => 456), 124);
assertEqual(fromEither(makeRight(123), (_x) => 456, (x) => x + 1), 124);
