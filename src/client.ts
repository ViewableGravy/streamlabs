import SockJS from 'sockjs-client';
import { TActiveRequest, TEvent, store } from './store';

type TMethod = 'getScenes' | 'auth'
type TParams = {
  resource: string;
  args?: Array<string>;
  compactMode?: boolean;
}
type TRequestOptions = {
  method: TMethod;
  params: TParams;
}
type TRequestCallback = (event: Record<string, unknown> & {
  jsonrpc: string;
  id: number;
}) => void

type TMakeRequestSync = ({ method, params }: TRequestOptions, callback: TRequestCallback) => void
type TMakeRequestAsync = ({ method, params }: TRequestOptions) => Promise<TEvent>
type TGenerateMakeRequestSync = (client: WebSocket) => TMakeRequestSync
type TGenerateMakeRequestAsync = (client: WebSocket) => TMakeRequestAsync

/**
 * Generates a makeRequest function with the client already bound for use elsewhere in the application;
 */
const generateMakeRequestSync: TGenerateMakeRequestSync = (client) => ({ method, params }, callback) => {
  const id = Math.floor(Math.random() * 1000000);

  //generate request object
  const request = {
    id,
    callback,
    request: {
      jsonrpc: "2.0",
      method,
      params,
      id
    }
  }

  //register request
  store.activeRequests.push(request);

  //make request
  client.send(JSON.stringify(request.request));
};

const generateMakeRequestAsync: TGenerateMakeRequestAsync = (client) => ({ method, params }) => {
  const id = Math.floor(Math.random() * 1000000);

  return new Promise((resolve, reject) => {
    //generate request object
    const request: TActiveRequest = {
      id,
      request: {
        jsonrpc: "2.0",
        method,
        params,
        id
      },
      callback: (event) => {
        if (event.result) {
          resolve(event);
        } else {
          reject(event);
        }
      }
    }
  
    //add to store
    store.activeRequests.push(request);

    //make request
    client.send(JSON.stringify(request.request));
  })
}

export const initializeSLOBSClient = (url: string): Promise<{ makeRequestSync: TMakeRequestSync, makeRequestAsync: TMakeRequestAsync }>  => {
  return new Promise((resolve, reject) => {
    const client = new SockJS(url)
    const makeRequestSync = generateMakeRequestSync(client);
    const makeRequestAsync = generateMakeRequestAsync(client);
    
    client.onopen = () => {
      makeRequestSync({
        method: "auth",
        params: { resource: "TcpServerService", args: [process.env.SLOBS_KEY ?? ''] },
      }, (event) => {
        if (event.result) {
          console.log('auth success: ', event);
          resolve({ makeRequestSync, makeRequestAsync });
        } else {
          console.log('auth failed: ', event);
          reject(event);
        }
      })
    };
    
    client.onclose = (event) => {
      console.log('socket has been closed: ', event?.code);

      process.exit(1);
    };
    
    client.onmessage = (event) => {
      const data = JSON.parse(event.data.toString()) as Record<string, unknown> & { jsonrpc: string, id: number }

      store.activeRequests.find(({ id }) => id === data.id)?.callback(data);
    };
  })
}