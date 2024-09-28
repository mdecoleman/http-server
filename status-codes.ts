export type StatusCode = 200 | 204 | 400 | 404;

export const statusCodeReasons = new Map<StatusCode, string>([
  [200, "OK"],
  [204, "No Content"],
  [400, "Bad Request"],
  [404, "Not Found"],
]);
