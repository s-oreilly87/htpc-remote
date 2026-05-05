"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const console_log_provider_class_1 = require("./console-log-provider.class");
const traceMock = jest.fn();
const debugMock = jest.fn();
const infoMock = jest.fn();
const warnMock = jest.fn();
const errorMock = jest.fn();
beforeAll(() => {
    global.console.trace = traceMock;
    global.console.debug = debugMock;
    global.console.info = infoMock;
    global.console.warn = warnMock;
    global.console.error = errorMock;
});
beforeEach(() => {
    jest.resetAllMocks();
});
describe("ConsoleLogProvider", () => {
    it.each([
        [
            console_log_provider_class_1.ConsoleLogLevel.TRACE,
            [traceMock, debugMock, infoMock, warnMock, errorMock],
            [],
        ],
        [
            console_log_provider_class_1.ConsoleLogLevel.DEBUG,
            [debugMock, infoMock, warnMock, errorMock],
            [traceMock],
        ],
        [
            console_log_provider_class_1.ConsoleLogLevel.INFO,
            [infoMock, warnMock, errorMock],
            [traceMock, debugMock],
        ],
        [
            console_log_provider_class_1.ConsoleLogLevel.WARN,
            [warnMock, errorMock],
            [traceMock, debugMock, infoMock],
        ],
        [
            console_log_provider_class_1.ConsoleLogLevel.ERROR,
            [errorMock],
            [traceMock, debugMock, infoMock, warnMock],
        ],
    ])(`should respect configured log level`, (level, validMocks, invalidMocks) => {
        // GIVEN
        const SUT = new console_log_provider_class_1.ConsoleLogProvider({ logLevel: level });
        // WHEN
        SUT.trace("test");
        SUT.debug("test");
        SUT.info("test");
        SUT.warn("test");
        SUT.error(new Error("test"));
        // THEN
        for (const mock of validMocks) {
            expect(mock).toBeCalledTimes(1);
        }
        for (const mock of invalidMocks) {
            expect(mock).not.toBeCalled();
        }
    });
    it.each([
        [console_log_provider_class_1.ConsoleLogLevel.TRACE, traceMock],
        [console_log_provider_class_1.ConsoleLogLevel.DEBUG, debugMock],
        [console_log_provider_class_1.ConsoleLogLevel.INFO, infoMock],
        [console_log_provider_class_1.ConsoleLogLevel.WARN, warnMock],
        [console_log_provider_class_1.ConsoleLogLevel.ERROR, errorMock],
    ])(`should respect configured log level`, (level, mock) => {
        // GIVEN
        const SUT = new console_log_provider_class_1.ConsoleLogProvider({ logLevel: level });
        // WHEN
        SUT.trace("test", { data: "test" });
        SUT.debug("test", { data: "test" });
        SUT.info("test", { data: "test" });
        SUT.warn("test", { data: "test" });
        SUT.error(new Error("test"), { data: "test" });
        // THEN
        expect(mock).toBeCalledTimes(1);
        if (level != console_log_provider_class_1.ConsoleLogLevel.ERROR) {
            expect(mock).toBeCalledWith(expect.any(String), expect.any(Object));
        }
        else {
            expect(mock).toBeCalledWith(expect.any(Error), expect.any(Object));
        }
    });
});
//# sourceMappingURL=console-log-provider.class.spec.js.map