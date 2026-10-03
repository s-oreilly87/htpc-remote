declare module "@novnc/novnc" {
  export interface RfbCredentials {
    password?: string;
    target?: string;
    username?: string;
  }

  export interface RfbOptions {
    credentials?: RfbCredentials;
    shared?: boolean;
  }

  export interface RfbEventDetail {
    clean?: boolean;
    name?: string;
    reason?: string;
    types?: string[];
  }

  export interface RfbEvent extends Event {
    detail: RfbEventDetail;
  }

  export default class RFB {
    constructor(target: HTMLElement, url: string, options?: RfbOptions);
    viewOnly: boolean;
    scaleViewport: boolean;
    resizeSession: boolean;
    addEventListener(
      type: "connect" | "credentialsrequired" | "desktopname" | "disconnect" | "securityfailure",
      listener: (event: RfbEvent) => void,
    ): void;
    disconnect(): void;
    focus(options?: FocusOptions): void;
    sendCredentials(credentials: RfbCredentials): void;
    sendKey(keysym: number, code: string | null, down?: boolean): void;
  }
}
