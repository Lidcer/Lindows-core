import { attachDebugMethod } from "../devDebugger";
import { includes, pushUniqToArray, removeFromArray } from "../../shared/utils";
import { SocketValidator } from "./WebsocketSecurity";
import { Server } from "http";
import SocketIO from "socket.io";
import { Client } from "./Client";
import { createSocketError } from "../../shared/Websocket";
import { startup } from "../startup";

type WebsocketCallback = (client: Client, ...args: any[] | any) => void;
type WebsocketCallbackPromise = (client: Client, ...args: any[] | any) => Promise<any>;
const ignoreEvents = ["connection", "disconnect"];

export class WebSocket {
  private socketServer: SocketIO.Server;
  private clients: Client[] = [];
  private callbacks = new Map<string, WebsocketCallback[]>();
  private promiseCallback = new Map<string, WebsocketCallbackPromise>();
  readonly socketValidator = new SocketValidator(this);

  constructor(server: Server) {
    this.socketServer = new SocketIO.Server(server);
    attachDebugMethod("webSocket", this);
    this.socketServer.on("connection", c => {
      const client = new Client(c);
      Logger.debug("[WebSocket]", "connected", client.id);
      this.clients.push(client);

      client.onAny(async (...args) => {
        const value = args[0];
        if (includes(ignoreEvents, value)) {
          return;
        }
        const len = args.length;
        const callback = args[len - 1];
        const promise = typeof callback === "function";
        if (promise) {
          const promise = this.promiseCallback.get(value);
          if (promise === undefined) {
            Logger.debug("WARNING", `Promise value "${value}" does not exit!`);
            callback(undefined, createSocketError("Unknown value", DEV ? undefined : null));
            return;
          }
          const filteredArgs = args.slice(1, args.length - 1);
          try {
            const result = await promise.apply(this, [client, ...filteredArgs]);
            callback(result);
          } catch (error) {
            const message = (error && error.message) || "Unknown error";
            const stack = error && error.stack;
            callback(undefined, createSocketError(message, DEV ? stack : null));
            Logger.debug("Socket promise error", error);
          }
        } else {
          const callbacks = this.callbacks.get(value);
          if (!callbacks) {
            Logger.debug("WARNING", `Value "${value}" does not exit!`);
            return;
          }
          const filteredArgs = args.slice(1);

          for (const callback of callbacks) {
            callback.apply(this, [client, ...filteredArgs]);
          }
        }
      });

      client.on("disconnect", () => {
        removeFromArray(this.clients, client);
        Logger.debug("[WebSocket]", "disconnected", client.id);
      });
    });
  }

  getAllClients() {
    return [...this.clients];
  }

  broadcast(message: string, arg1?: any, arg2?: any, arg3?: any) {
    if (!message.length) {
      throw new Error("Cannot broadcast empty message");
    }
    for (const client of this.clients) {
      client.emit(message, arg1, arg2, arg3);
    }
  }

  on<T extends any[]>(value: string, callback: (client: Client, ...args: T) => void | Promise<void>) {
    const callbackFunction = this.callbacks.get(value) || [];
    pushUniqToArray(callbackFunction, callback);
    this.callbacks.set(value, callbackFunction);
  }
  off(value: string, callback: (client: Client, ...args) => void) {
    const callbackFunction = this.callbacks.get(value) || [];
    removeFromArray(callbackFunction, callback);
    this.callbacks.set(value, callbackFunction);
  }
  onPromise<A, T extends any[]>(value: string, callback: (client: Client, ...args: T) => Promise<A>) {
    if (!(callback instanceof (async () => {}).constructor)) {
      const err = new Error("Promise callback expected");
      throw err;
    }

    const promiseFn = this.promiseCallback.get(value);
    if (promiseFn) {
      const err = new Error(`Used value: "${value}" Already exist!`);
      throw err;
    }
    this.promiseCallback.set(value, callback);
  }
  offPromise(value: string, callback: (client: Client, ...args: any[]) => void) {
    const promiseCallback = this.promiseCallback.get(value);
    if (promiseCallback === callback) {
      this.promiseCallback.delete(value);
    }
  }
  getClients() {
    return this.clients;
  }
}
