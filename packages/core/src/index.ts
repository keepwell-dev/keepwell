// Core: pure decision logic with no I/O. Other packages import the core only through this file.
export { isRefusalCode, refusalCodes } from "./refusals.ts";
export type { RefusalCode } from "./refusals.ts";
