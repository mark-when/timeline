declare const acquireVsCodeApi:
  | (() => { postMessage: (message: any) => void })
  | undefined;

  