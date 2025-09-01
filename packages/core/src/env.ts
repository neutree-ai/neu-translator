/// <reference path="./env.d.ts" />

export function getEnvVariable(key: string): string | undefined {
  // nodejs
  // @ts-ignore
  if (typeof process !== "undefined" && process.env) {
    // @ts-ignore
    return process.env[key];
  }

  // vite
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[key];
  }
}
