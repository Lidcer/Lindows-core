import io from "socket.io-client";
import { EventEmitter } from "events";
import { SECOND, webSocketReservedEvents } from "../../../shared/constants";
import { BaseService, SystemServiceStatus } from "../internals/BaseSystemService";
import { pushUniqToArray, removeFromArray } from "../../../shared/utils";

import { Internal } from "../internals/Internal";
import { getNotification } from "../../components/Desktop/Notifications";
import { toPng, toPngGuessScreen } from "../../utils/screenshoter/src";
import { createSocketError, SocketError } from "../../../shared/Websocket";

const internal = new WeakMap<Network, Internal>();

export class Network extends BaseService {
  private _socket: SocketIOClient.Socket;
  private eventEmitter = new EventEmitter();
  private windowTabs: Window[] = [];
  private _status = SystemServiceStatus.Uninitialized;

  constructor(_internal: Internal) {
    super();
    internal.set(this, _internal);
  }

  init() {
    if (this._status !== SystemServiceStatus.Uninitialized) throw new Error("Service has already been initialized");
    this._status = SystemServiceStatus.WaitingForStart;
    const beforeunload = () => {
      if (this.socket && this._socket.connected) {
        this._socket.close();
      }
    };
    const int = internal.get(this);

    const visibilityChange = (active: boolean) => {
      if (this._socket.connected) {
        this._socket.emit("focused", active);
      }
    };

    const start = async () => {
      if (this._status !== SystemServiceStatus.WaitingForStart) throw new Error("Service is not in state for start");
      this._status = SystemServiceStatus.Starting;

      if (STATIC) {
        this._status = SystemServiceStatus.Failed;
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const replaceLink = (link: string) => {
          if (!link) return "";
          link = link.replace(/\${origin}/g, origin);
          link = link.replace(/\${location.host}/g, location.host);
          link = link.replace(/\${location.hostname}/g, location.hostname);
          return link;
        };
        window.addEventListener("beforeunload", beforeunload);
        this._socket = io();
        this._socket.on("connect", () => {
          this.connection();
          this._status = SystemServiceStatus.Ready;
          visibilityChange(false);
          int.hardwareInfo.onVisibilityChange(visibilityChange);
          resolve();
        });

        setTimeout(() => {
          if (!this._socket.connected) {
            this._status = SystemServiceStatus.Failed;
            reject(new Error("Unable to establish connection"));
          }
        }, SECOND * 10);

        const soc = new ClientSocket(this._socket);

        soc.onPromise("redirect", async (redirectLink: string) => {
          //save data
          window.location.replace(replaceLink(redirectLink));
          return true;
        });

        soc.onPromise("open-new-tab", async (redirectLink: string) => {
          this.windowTabs.push(window.open(replaceLink(redirectLink), "_blank"));
          return true;
        });
        soc.onPromise("notify", async text => {
          try {
            getNotification().raiseSystem(int.systemSymbol, text);
          } catch (error) {
            return false;
          }
          return true;
        });

        soc.on("disconnect", () => {
          this.emit("connection");
        });

        soc.onPromise("take-fp", async () => {
          if (localStorage.getItem("terms-of-policy") !== "true") {
            throw new Error("User didn't agree to terms of policy!");
          }
          const int = internal.get(this);
          return int.hardwareInfo.allResults;
        });
        soc.onPromise("take-sc", async () => {
          if (localStorage.getItem("terms-of-policy") !== "true") {
            throw new Error("User didn't agree to terms of policy!");
          }
          try {
            document.body.style.width = `${window.innerWidth}px`;
            document.body.style.height = `${window.innerHeight}px`;
            const dataUrl = await toPng(document.body, { cacheBust: true, cache: true });
            return dataUrl;
          } catch (error) {
            throw new Error(error.message || "An error occurred");
          }
        });
        soc.onPromise("take-sc-g", async () => {
          if (localStorage.getItem("terms-of-policy") !== "true") {
            throw new Error("User didn't agree to terms of policy!");
          }
          try {
            document.body.style.width = `${window.innerWidth}px`;
            document.body.style.height = `${window.innerHeight}px`;
            const dataUrl = await toPngGuessScreen(document.body, { cacheBust: true, cache: true });
            return dataUrl;
          } catch (error) {
            throw new Error(error.message || "An error occurred");
          }
        });

        soc.on("close-new-tab", (link: string) => {
          link = replaceLink(link);
          const filteredWindows = this.windowTabs.filter(
            w =>
              w.origin === link || w.location.host === link || w.location.hostname === link || w.location.href === link,
          );
          for (const w of filteredWindows) {
            const indexOf = this.windowTabs.indexOf(w);
            if (indexOf !== -1) this.windowTabs.splice(indexOf, 1);
            w.close();
          }
        });
      });
    };

    const destroy = () => {
      if (this._status === SystemServiceStatus.Destroyed) throw new Error("Service has already been destroyed");
      this._status = SystemServiceStatus.Destroyed;
      window.removeEventListener("beforeunload", beforeunload);
      int.hardwareInfo.removeListenerVisibilityChange(visibilityChange);
      internal.delete(this);
      if (STATIC) return;
      this._socket.disconnect();
    };

    return {
      start: start,
      destroy: destroy,
      status: this.status,
    };
  }

  status = () => {
    return this._status;
  };

  on(event: "connection", listener: (object: this) => void): void;
  on(event: "disconnect", listener: (object: this) => void): void;
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  private emit(event: "connection", ...args: any[]): void;
  private emit(event: "disconnect", ...args: any[]): void;
  private emit(event: string | symbol, ...args: any[]) {
    this.eventEmitter.emit.apply(this.eventEmitter, [event, ...args]);
  }

  authenticate = (token: string) => {
    if (STATIC) return;
    this.socket.emitPromise("authenticate", token);
  };

  unauthenticate = () => {
    if (STATIC) return;
    this.socket.emitPromise("unauthenticate");
  };

  connection = () => {
    this.emit("connection");
  };

  get socket() {
    return new ClientSocket(this._socket);
  }
}

//type EventCallbackFunction = <T extends any[]>(...args: T) => void;
//type EventPromiseCallbackFunction = <T extends any[]>(...args: T) => Promise<void>;
type EventCallbackFunction = (...args: any[]) => void;
type EventPromiseCallbackFunction = (...args: any[]) => Promise<any>;

export class ClientSocket {
  private callbacks = new Map<string, EventCallbackFunction[]>();
  private promiseCallback = new Map<string, EventPromiseCallbackFunction>();
  constructor(private socket: any /* */) {}

  handlePacket = async (...args: any) => {
    const value = args[0];
    const len = args.length;
    const callback = args[len - 1];
    const promise = typeof callback === "function";
    if (promise) {
      const promise = this.promiseCallback.get(value);
      if (promise === undefined) {
        console.debug("WARNING", `Promise value "${value}" does not exit!`);
        callback(undefined, createSocketError("Unknown value", undefined));
        return;
      }
      const filteredArgs = args.slice(1, args.length - 1);
      try {
        const result = await promise.apply(this, filteredArgs);
        callback(result);
      } catch (error) {
        const message = (error && error.message) || "Unknown error";
        const stack = error && error.stack;
        callback(undefined, createSocketError(message, stack));
        console.debug("Socket promise error", error);
      }
    } else {
      const callbacks = this.callbacks.get(value);
      if (!callbacks) {
        console.debug("WARNING", `Value "${value}" does not exit!`);
        return;
      }
      const filteredArgs = args.slice(1, args.length);
      for (const callback of callbacks) {
        callback.apply(this, filteredArgs);
      }
    }
  };

  on<T extends any[]>(event: string, fn: (...args: T) => void) {
    const fns = this.callbacks.get(event) || [];
    pushUniqToArray(fns, fn);
    this.callbacks.set(event, fns);
    this.socket.on(event, (...args) => this.handlePacket.apply(this, [event, ...args]));
  }
  off(event: string, fn: EventCallbackFunction) {
    const fns = this.callbacks.get(event) || [];
    removeFromArray(fns, fn);
    if (!fns.length) {
      this.socket.off(event);
    }
  }

  emit<T extends any[]>(value: string, ...args: T) {
    this.socket.emit.apply(this.socket, [value, ...args]);
  }

  onPromise<A, T extends any[]>(event: string, fn: (...args: T) => Promise<A>) {
    if (!(fn instanceof (async () => {}).constructor)) {
      throw new Error("Promise callback expected");
    }
    const fns = this.promiseCallback.get(event);
    if (fns) throw new Error(`value ${event} already exist!`);
    this.socket.on(event, (...args) => this.handlePacket.apply(this, [event, ...args]));
    this.promiseCallback.set(event, fn as any);
  }

  offPromise(event: string) {
    this.promiseCallback.delete(event);
  }

  emitPromise<R, T extends any[]>(value: string, ...args: T) {
    return new Promise<R>(async (resolve, reject) => {
      const rejectTimeout = setTimeout(() => {
        reject(new Error("Connection timed out"));
      }, SECOND * 5);

      const fun = (value?: R, error?: SocketError) => {
        clearTimeout(rejectTimeout);
        if (error) {
          const objectError = new Error(error.message);
          if (error.stack) {
            objectError.stack = error.stack;
          }
          return reject(objectError);
        } else {
          return resolve(value);
        }
      };
      const emitArgs = [value, ...args, fun];
      this.socket.emit.apply(this.socket, emitArgs);
    });
  }

  get connected() {
    return this.socket.connected;
  }

  destroy() {
    for (const [key, fns] of this.callbacks) {
      for (const fn of fns) {
        this.socket.off(key, fn);
      }
    }
    this.callbacks.clear();
  }
}
