"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const provider_registry_class_1 = __importDefault(require("./provider-registry.class"));
describe("DefaultProviderRegistry", () => {
    describe("non-defaults", () => {
        it("should not have a default ImageFinder registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getImageFinder).toThrowError(/.*Error: No ImageFinder registered/);
        });
        it("should not have a default TextFinder registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getTextFinder).toThrowError(/.*Error: No TextFinder registered/);
        });
        it("should not have a default WindowFinder registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getWindowFinder).toThrowError(/.*Error: No WindowFinder registered/);
        });
    });
    describe("defaults", () => {
        it("should have a default ImageProcessor registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getImageProcessor).not.toThrowError();
        });
        it("should have a default ImageWriter registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getImageWriter).not.toThrowError();
        });
        it("should have a default ImageReader registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getImageReader).not.toThrowError();
        });
        it("should have a default Clipboard registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getClipboard).not.toThrowError();
        });
        it("should have a default Keyboard registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getKeyboard).not.toThrowError();
        });
        it("should have a default Mouse registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getMouse).not.toThrowError();
        });
        it("should have a default Screen registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getScreen).not.toThrowError();
        });
        it("should have a default WindowProvider registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getWindow).not.toThrowError();
        });
        it("should have a default LogProvider registered", () => {
            // GIVEN
            // WHEN
            // THEN
            expect(provider_registry_class_1.default.getLogProvider).not.toThrowError();
        });
    });
    describe("resets", () => {
        it("should throw on missing ImageProcessor", () => {
            // GIVEN
            // WHEN
            provider_registry_class_1.default.registerImageProcessor(undefined);
            // THEN
            expect(provider_registry_class_1.default.getImageProcessor).toThrowError();
        });
        it("should throw on missing ImageWriter", () => {
            // GIVEN
            // WHEN
            provider_registry_class_1.default.registerImageWriter(undefined);
            // THEN
            expect(provider_registry_class_1.default.getImageWriter).toThrowError();
        });
        it("should throw on missing ImageReader", () => {
            // GIVEN
            // WHEN
            provider_registry_class_1.default.registerImageReader(undefined);
            // THEN
            expect(provider_registry_class_1.default.getImageReader).toThrowError();
        });
        it("should throw on missing Clipboard", () => {
            // GIVEN
            // WHEN
            provider_registry_class_1.default.registerClipboardProvider(undefined);
            // THEN
            expect(provider_registry_class_1.default.getClipboard).toThrowError();
        });
        it("should throw on missing Keyboard", () => {
            // GIVEN
            // WHEN
            provider_registry_class_1.default.registerKeyboardProvider(undefined);
            // THEN
            expect(provider_registry_class_1.default.getKeyboard).toThrowError();
        });
        it("should throw on missing Mouse", () => {
            // GIVEN
            // WHEN
            provider_registry_class_1.default.registerMouseProvider(undefined);
            // THEN
            expect(provider_registry_class_1.default.getMouse).toThrowError();
        });
        it("should throw on missing Screen", () => {
            // GIVEN
            // WHEN
            provider_registry_class_1.default.registerScreenProvider(undefined);
            // THEN
            expect(provider_registry_class_1.default.getScreen).toThrowError();
        });
        it("should throw on missing Window", () => {
            // GIVEN
            // WHEN
            provider_registry_class_1.default.registerWindowProvider(undefined);
            // THEN
            expect(provider_registry_class_1.default.getWindow).toThrowError();
        });
    });
});
//# sourceMappingURL=provider-registry.class.spec.js.map