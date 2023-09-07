import { Request } from "express";
import { WebSocket } from "ws";
import MetisSession from "metis/server/sessions";
import ClientConnection from "metis/server/connect/clients";
import { TMetisRouterMap } from "metis/server/http/router";
import expressWs from "express-ws";

const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
  done: () => void
) => {
  // Route for establishing a web socket connection
  // used for user and game session syncing between
  // the server and the client.
  router.ws("/connect", (socket: WebSocket, request: Request) => {
    let session: MetisSession | undefined = MetisSession.get(
      request.session.userID
    );

    // If no session between the client and the
    // server exists, close the connection.
    if (session === undefined) {
      return socket.close();
    }

    // Parse disconnectExisting query.
    let disconnectExisting: boolean =
      request.query.disconnectExisting === "true";

    // Create a client connection object
    // with the socket and session.
    let client = new ClientConnection(socket, session, { disconnectExisting });
  });

  done();
};

export default routerMap;
