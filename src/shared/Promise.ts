import { SECOND } from "./constants";
export class TimeoutPromise<T = any> extends Promise<T> {
  constructor(executor: (resolve: (value?: T) => void, reject: (reason?: any) => void) => void, ms = SECOND) {
    super((resolve, reject) => {
      executor(resolve, reject);
      if (ms) {
        setTimeout(() => {
          reject(new Error("Timed out"));
        }, ms);
      }
    });
  }
}

export function isPromise<T = void>(fn: any): fn is Promise<T> {
  return fn instanceof (async () => {}).constructor || fn instanceof Promise;
}
