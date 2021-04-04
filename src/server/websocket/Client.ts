import { SECOND } from "../../shared/constants";
import SocketIO from "socket.io";
import { SocketError } from "../../shared/Websocket";

export class Client {
  _active: boolean;
  type: string;

  constructor(private client: SocketIO.Socket) {}

  onAny(listener: (...args: any[]) => void) {
    this.client.onAny(listener);
    return this;
  }
  on(event: string, listener: (...args: any[]) => void) {
    this.client.on(event, listener);
  }
  emit(event: string, ...args: any[]) {
    return this.client.emit.apply(this.client, [event, ...args]);
  }
  emitPromise<R = any>(value: string, ...args: any[]) {
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
          resolve(value);
        }
      };
      const emitArgs = [value, ...args, fun];
      this.client.emit.apply(this.client, emitArgs);
    });
  }
  disconnect() {
    return this.client.disconnect();
  }
  get id() {
    return this.client.id;
  }
  get connected() {
    return this.client.connected;
  }
  get disconnected() {
    return this.client.disconnected;
  }
  get active() {
    if (this.disconnected) return false;
    return this._active;
  }
  set active(value: boolean) {
    this._active = value;
  }
  get remoteAddress() {
    return this.client.conn.remoteAddress;
  }
}
