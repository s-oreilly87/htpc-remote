export declare type LogFunction = (message: string, data?: {}) => void;
export declare type ErrorLogFunction = (error: Error, data?: {}) => void;
export interface LogProviderInterface {
    trace: LogFunction;
    debug: LogFunction;
    info: LogFunction;
    warn: LogFunction;
    error: ErrorLogFunction;
}
export declare function wrapLogger(originalLogger: LogProviderInterface): LogProviderInterface;
//# sourceMappingURL=log-provider.interface.d.ts.map