//SocketIO.Socket
import { Client } from "./Client";
import { WebSocket } from "./SocketHandler";

export class SocketValidator {
  constructor(private webSocket: WebSocket) {}

  validateString(client: Client, string: string) {
    if (typeof string !== "string") {
      client.disconnect();
      Logger.error("[Websocket security]", `Unable to validate string client: ${client.id}}`.trim());
      return false;
    }
    return true;
  }

  validateNumber(client: Client, number: number) {
    if (typeof number !== "number") {
      client.disconnect();
      Logger.error("[Websocket security]", `Unable to validate number client: ${client.id}}`.trim());
      return false;
    }
    return true;
  }

  validateBoolean(client: Client, boolean: boolean) {
    if (typeof boolean !== "boolean") {
      client.disconnect();
      Logger.error("[Websocket security]", `Unable to validate boolean client: ${client.id}`.trim());
      return false;
    }
    return true;
  }

  validateBigInt(client: Client, bigInt: bigint) {
    if (typeof bigInt !== "bigint") {
      client.disconnect();
      Logger.error("[Websocket security]", `Unable to validate bigInt client: ${client.id}`.trim());
      return false;
    }
    return true;
  }

  validateObject(client: Client, object: object) {
    if (typeof object !== "object") {
      client.disconnect();
      Logger.error("[Websocket security]", `Unable to validate object client: ${client.id}`.trim());
      return false;
    }
    return true;
  }

  validateArray(client: Client, array: object[]) {
    if (!Array.isArray(array)) {
      client.disconnect();
      Logger.error("[Websocket security]", `Unable to validate array client: ${client.id}`.trim());
      return false;
    }
    return true;
  }

  validateUndefined(client: Client, und: undefined) {
    if (und !== undefined) {
      client.disconnect();
      Logger.error("[Websocket security]", `Unable to validate undefined client: ${client.id}`.trim());
      return false;
    }
    return true;
  }

  validateNull(client: Client, nu: null) {
    if (nu !== null) {
      client.disconnect();
      Logger.error("[Websocket security]", `Unable to validate null client: ${client.id}`.trim());
      return false;
    }
    return true;
  }
}
