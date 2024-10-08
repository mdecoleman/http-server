import { RequestBuilder, Request } from "./request-builder.ts";
import { ResponseBuilder } from "./response-builder.ts";

interface RouteHandler {
  method: "GET" | "POST";
  path: string;
  handler: (req: Request, res: ResponseBuilder) => Promise<void>;
}

export class Server {
  private _port = 8080;
  private _routeHandlers: RouteHandler[] = [];

  private async parseRequest(connection: Deno.Conn) {
    const buffer = new Uint8Array(1024);

    const bytesRead = await connection.read(buffer);

    if (bytesRead === null) return null;

    const rawRequest = new TextDecoder().decode(buffer.subarray(0, bytesRead));

    const requestBuilder = new RequestBuilder();

    const requestParts = rawRequest.split("\r\n");

    let isEndOfHeader = false;

    for (let partIndex = 0; partIndex < requestParts.length; partIndex++) {
      const part = requestParts[partIndex];

      // Request line
      if (partIndex === 0) {
        const reqestLine = part.split(" ");

        requestBuilder.setMethod(reqestLine[0]);
        requestBuilder.setPath(reqestLine[1]);
        requestBuilder.setHttpVersion(reqestLine[2]);

        continue;
      }

      // Add Header
      if (!isEndOfHeader && part.length > 0) {
        const [key, value] = part.split(":");

        requestBuilder.addHeader(key.trim(), value.trim());
      }

      // End of Headers
      if (!isEndOfHeader && part === "") {
        isEndOfHeader = true;
        continue;
      }

      if (isEndOfHeader) {
        if (part && part.length > 0) {
          console.info("body", part);
          // Set Body
          requestBuilder.setBody(part);
          break;
        }
      }
    }

    const request = requestBuilder.build();

    return request;
  }

  private async writeResponse(connection: Deno.Conn, response: string) {
    await connection.write(new TextEncoder().encode(response));
  }

  private async handleConnection(connection: Deno.Conn) {
    const request = await this.parseRequest(connection);

    const response = new ResponseBuilder();

    if (!request) {
      const response = new ResponseBuilder()
        .setStatusCode(400)
        .setBody("Bad Request")
        .addHeader("Content-Type", "text/plain")
        .build();

      await this.writeResponse(connection, response);

      connection.close();

      return;
    }

    let routeMatched = false;

    for (const { handler, method, path } of this._routeHandlers) {
      if (method === request.method && path === request.path) {
        await handler(request, response);
        routeMatched = true;
        break;
      }
    }

    if (!routeMatched) {
      response
        .setStatusCode(404)
        .setBody("Not Found")
        .addHeader("Content-Type", "text/plain");
    }

    await this.writeResponse(connection, response.build());
    connection.close();
  }

  port(port: number) {
    this._port = port;
    return this;
  }

  get(
    path: string,
    handler: (req: Request, res: ResponseBuilder) => Promise<void>
  ) {
    this._routeHandlers.push({ method: "GET", path, handler });

    return this;
  }

  post(
    path: string,
    handler: (req: Request, res: ResponseBuilder) => Promise<void>
  ) {
    this._routeHandlers.push({ method: "POST", path, handler });

    return this;
  }

  async listen() {
    const listener = Deno.listen({ port: this._port });

    console.info(`Server listening on port ${this._port}`);

    for await (const connection of listener) {
      this.handleConnection(connection);
    }
  }
}
