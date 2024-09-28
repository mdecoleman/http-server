export interface Request {
  method: string;
  path: string;
  body: string | null;
  httpVersion: string;
  headers: Map<string, string>;
}

export class RequestBuilder {
  private _method = "";
  private _path = "";
  private _httpVersion = "";
  private _headers = new Map<string, string>();
  private _body: string | null = null;

  setMethod(method: string) {
    this._method = method;
    return this;
  }

  setHttpVersion(httpVersion: string) {
    this._httpVersion = httpVersion;
    return this;
  }

  setPath(path: string) {
    this._path = path;
    return this;
  }

  addHeader(key: string, value: string) {
    this._headers.set(key, value);
    return this;
  }

  setBody(body: string) {
    this._body = body;
    return this;
  }

  build(): Request {
    return {
      method: this._method,
      path: this._path,
      httpVersion: this._httpVersion,
      headers: this._headers,
      body: this._body,
    };
  }
}
