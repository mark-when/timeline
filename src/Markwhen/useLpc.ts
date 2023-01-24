import type { EventPath, EventPaths } from "@/Timeline/paths";
import type { Node, NodeArray } from "@markwhen/parser/lib/Node";
import type { Timeline } from "@markwhen/parser/lib/Types";

export interface AppState {
  isDark?: boolean;
  hoveringPath?: EventPaths;
  detailPath?: EventPath;
  pageIndex: number;
}
export interface MarkwhenState {
  rawText?: string;
  parsed: Timeline[];
  page: PageState;
}
export interface PageState {
  parsed?: Timeline;
  transformed?: Node<NodeArray>;
}
export interface State {
  app: AppState;
  markwhen: MarkwhenState;
}

interface MessageTypes {
  state: State;
  setHoveringPath: EventPath;
  setDetailPath: EventPath;
}

type MessageType = keyof MessageTypes;
type MessageParam<T extends keyof MessageTypes> = MessageTypes[T];

export interface Message<T extends MessageType> {
  type: T;
  request?: boolean;
  response?: boolean;
  id: string;
  params?: MessageParam<T>;
}
export const getNonce = () => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

type MessageListeners = {
  [Property in keyof MessageTypes]?: (event: MessageTypes[Property]) => any;
};

const post = <T extends MessageType>(message: Message<T>) =>
  window.parent.postMessage(message, "*");

export const useLpc = (listeners?: MessageListeners) => {
  const calls: Map<
    string,
    {
      resolve: (a: any) => void;
      reject: (a: any) => void;
    }
  > = new Map();

  const postRequest = <T extends MessageType>(
    type: T,
    params?: MessageParam<T>
  ) => {
    const id = `markwhen_${getNonce()}`;
    return new Promise((resolve, reject) => {
      calls.set(id, { resolve, reject });
      post({
        type,
        request: true,
        id,
        params,
      });
    });
  };

  const postResponse = <T extends MessageType>(
    id: string,
    type: T,
    params?: MessageParam<T>
  ) => post<T>({ type, response: true, id, params });

  window.addEventListener(
    "message",
    <T extends keyof MessageTypes>(e: MessageEvent<Message<T>>) => {
      if (!e.data.id || !e.data.id.startsWith("markwhen")) {
        return;
      }

      const data = e.data;
      if (data.response) {
        calls.get(data.id)?.resolve(data);
        calls.delete(data.id);
      } else if (data.request) {
        const result = listeners?.[data.type]?.(data.params!);
        Promise.resolve(result).then((resp) => {
          postResponse(data.id, data.type, resp);
        });
      } else {
        console.error("Not a request or response", data);
      }
    }
  );

  return { postRequest };
};
