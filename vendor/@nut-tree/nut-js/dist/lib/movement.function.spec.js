"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const movement_function_1 = require("./movement.function");
const sneer_1 = require("sneer");
const point_class_1 = require("./point.class");
beforeEach(() => {
    jest.clearAllMocks();
});
const lineHelperMock = {
    straightLine: jest.fn(),
};
const currentPosition = new point_class_1.Point(500, 500);
const providerRegistryMock = (0, sneer_1.mockPartial)({
    getMouse() {
        return (0, sneer_1.mockPartial)({
            currentMousePosition: () => Promise.resolve(currentPosition),
        });
    },
});
describe("MovementApi", () => {
    describe("Relative movement", () => {
        it("should move the cursor down starting from the current mouse position", async () => {
            // GIVEN
            const SUT = (0, movement_function_1.createMovementApi)(providerRegistryMock, lineHelperMock);
            const step = 100;
            const targetPoint = new point_class_1.Point(currentPosition.x, currentPosition.y + step);
            // WHEN
            await SUT.down(step);
            // THEN
            expect(lineHelperMock.straightLine).toBeCalledTimes(1);
            expect(lineHelperMock.straightLine).toBeCalledWith(currentPosition, targetPoint);
        });
        it("should move the cursor up starting from the current mouse position", async () => {
            // GIVEN
            const SUT = (0, movement_function_1.createMovementApi)(providerRegistryMock, lineHelperMock);
            const step = 100;
            const targetPoint = new point_class_1.Point(currentPosition.x, currentPosition.y - step);
            // WHEN
            await SUT.up(step);
            // THEN
            expect(lineHelperMock.straightLine).toBeCalledTimes(1);
            expect(lineHelperMock.straightLine).toBeCalledWith(currentPosition, targetPoint);
        });
        it("should move the cursor left starting from the current mouse position", async () => {
            // GIVEN
            const SUT = (0, movement_function_1.createMovementApi)(providerRegistryMock, lineHelperMock);
            const step = 100;
            const targetPoint = new point_class_1.Point(currentPosition.x - step, currentPosition.y);
            // WHEN
            await SUT.left(step);
            // THEN
            expect(lineHelperMock.straightLine).toBeCalledTimes(1);
            expect(lineHelperMock.straightLine).toBeCalledWith(currentPosition, targetPoint);
        });
        it("should move the cursor right starting from the current mouse position", async () => {
            // GIVEN
            const SUT = (0, movement_function_1.createMovementApi)(providerRegistryMock, lineHelperMock);
            const step = 100;
            const targetPoint = new point_class_1.Point(currentPosition.x + step, currentPosition.y);
            // WHEN
            await SUT.right(step);
            // THEN
            expect(lineHelperMock.straightLine).toBeCalledTimes(1);
            expect(lineHelperMock.straightLine).toBeCalledWith(currentPosition, targetPoint);
        });
    });
    describe("straightTo", () => {
        it("should throw on non-Point input", async () => {
            // GIVEN
            const api = (0, movement_function_1.createMovementApi)(providerRegistryMock, lineHelperMock);
            // WHEN
            const SUT = () => api.straightTo({ foo: "bar" });
            // THEN
            await expect(SUT()).rejects.toThrowError(/straightTo requires a Point.*/);
        });
        it("should move the cursor straight to the target point starting from the current mouse position", async () => {
            // GIVEN
            const SUT = (0, movement_function_1.createMovementApi)(providerRegistryMock, lineHelperMock);
            const step = 100;
            const targetPoint = new point_class_1.Point(currentPosition.x, currentPosition.y - step);
            // WHEN
            await SUT.straightTo(targetPoint);
            // THEN
            expect(lineHelperMock.straightLine).toBeCalledTimes(1);
            expect(lineHelperMock.straightLine).toBeCalledWith(currentPosition, targetPoint);
        });
    });
});
//# sourceMappingURL=movement.function.spec.js.map