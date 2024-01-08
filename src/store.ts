export type TEvent = Record<string, unknown> & {
  jsonrpc: string;
  id: number;
}

export type TActiveRequest = {
  id: number;
  callback: (event: TEvent) => void;
  request: {
    jsonrpc: string;
    method: string;
    params: Record<string, any>;
    id: number;
  };
}

const activeRequests: Array<TActiveRequest> = [];

export const store = {
  activeRequests
} as const;