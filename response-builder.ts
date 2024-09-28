import { StatusCode, statusCodeReasons } from "./status-codes.ts";

export class ResponseBuilder {
  private _headers = new Map<string, string>();
  private _statusCode: StatusCode;
  private _body: string;

  constructor() {
    this._statusCode = 200;
    this._body = "";
  }

  addHeader(key: string, value: string) {
    this._headers.set(key, value);
    return this;
  }

  setStatusCode(statusCode: StatusCode) {
    this._statusCode = statusCode;
    return this;
  }

  setBody(body: string) {
    this._body = body;
    return this;
  }

  build() {
    const response: string[] = [];

    // Set status line
    response.push(
      `HTTP/1.1 ${this._statusCode} ${statusCodeReasons.get(
        this._statusCode
      )}\r\n`
    );

    this._headers.set("Server", "Deno");

    // Begin headers
    if (this._statusCode !== 204) {
      this._headers.set("Content-Length", `${this._body.length}`);
    }

    for (const header of this._headers.keys()) {
      response.push(`${header}: ${this._headers.get(header)}\r\n`);
    }

    // End header
    response.push("\r\n");

    // Add body
    if (this._statusCode !== 204) {
      response.push(this._body);
    }

    return response.join("");
  }
}
