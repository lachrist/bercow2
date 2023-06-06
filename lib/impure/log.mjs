import { stdout } from "node:process";

/** @type {(message: string) => Promise<void>} */
export const log = async (message) => {
  stdout.write(`${message}\n`);
};
