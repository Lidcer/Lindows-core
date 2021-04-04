import { WebSocket } from "./SocketHandler";

export function setupClientVisibility(socket: WebSocket) {
  socket.on<[boolean]>("focused", (client, active) => {
    socket.socketValidator.validateBoolean(client, active);
    client.active = active;
  });
}
