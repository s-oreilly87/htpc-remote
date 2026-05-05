"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapLogger = void 0;
const logIdentifier = "[nut.js]";
const nonErrorLevels = ['info', 'warn', 'debug', 'trace'];
const errorLevels = ['error'];
function wrapLogger(originalLogger) {
    for (const level of nonErrorLevels) {
        const originalMethod = originalLogger[level];
        originalLogger[level] = (message, data) => {
            const wrappedMessage = `${logIdentifier} - ${message}`;
            originalMethod(wrappedMessage, data);
        };
    }
    for (const level of errorLevels) {
        const originalMethod = originalLogger[level];
        originalLogger[level] = (message, data) => {
            const wrappedMessage = `${logIdentifier} - ${message}`;
            message.message = wrappedMessage;
            originalMethod(message, data);
        };
    }
    return originalLogger;
}
exports.wrapLogger = wrapLogger;
//# sourceMappingURL=log-provider.interface.js.map