/**
 * @param {number} x
 * @param {number} y
 * @return {number}
 */
export const cantorPairing = (x, y) => 1/2 * (x + y) * (x + y + 1) + y;
