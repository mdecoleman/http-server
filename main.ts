import { RequestBuilder } from "./request-builder.ts";
import { ResponseBuilder } from "./response-builder.ts";

const port = 8080;

const listener = Deno.listen({ port });

console.info(`Server listening on port ${port}`);

async function writeResponse(connection: Deno.Conn, response: string) {
  await connection.write(new TextEncoder().encode(response));
}

async function connectionHandler(connection: Deno.Conn) {
  const buffer = new Uint8Array(1024);

  const bytesRead = await connection.read(buffer);

  if (bytesRead === null) {
    const response = new ResponseBuilder().setStatusCode(400).build();

    await writeResponse(connection, response);
  } else {
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

    const response = new ResponseBuilder()
      .setStatusCode(200)
      .addHeader("Content-Type", "application/json")
      .setBody(
        JSON.stringify(
          {
            ...request,
            headers: Object.fromEntries(request.headers),
          },
          (_key, value) => (value === null ? undefined : value)
        )
      )
      .build();

    await writeResponse(connection, response);
  }

  return connection.close();
}

for await (const connection of listener) {
  connectionHandler(connection);
}
