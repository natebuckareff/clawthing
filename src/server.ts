export interface ServerEndpoint {
  host: string;
  port: number;
}

export interface ServerEntry {
  name: string;
  endpoint: ServerEndpoint;
}

export const DEFAULT_SERVER_PORT = 10450;
export const DEFAULT_SERVER_HOST = "127.0.0.1";
export const DEFAULT_SERVER_URL = `http://${DEFAULT_SERVER_HOST}:${DEFAULT_SERVER_PORT}`;

export function endpointUrl(endpoint: ServerEndpoint): string {
  const host =
    endpoint.host.includes(":") && !endpoint.host.startsWith("[")
      ? `[${endpoint.host}]`
      : endpoint.host;
  return `http://${host}:${endpoint.port}`;
}

export function isServerUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
