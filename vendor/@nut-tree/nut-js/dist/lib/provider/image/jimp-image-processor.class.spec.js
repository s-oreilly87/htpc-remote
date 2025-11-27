"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const image_class_1 = require("../../image.class");
const point_class_1 = require("../../point.class");
const jimp_image_processor_class_1 = __importDefault(require("./jimp-image-processor.class"));
const imageWidth = 10;
const imageHeight = 20;
describe("JimpImageProcessor", () => {
    it.each([[new point_class_1.Point(-1, 5)], [new point_class_1.Point(imageWidth + 5, 5)]])(`should reject on out of bounds x coordinates`, async (outOfBoundsPoint) => {
        // GIVEN
        const inputImage = new image_class_1.Image(imageWidth, imageHeight, Buffer.from([0, 0, 0]), 3, "input_image", 4, 4);
        const SUT = new jimp_image_processor_class_1.default();
        // WHEN
        const result = SUT.colorAt(inputImage, outOfBoundsPoint);
        // THEN
        await expect(result).rejects.toBe(`Query location out of bounds. Should be in range 0 <= x < image.width, is ${outOfBoundsPoint.x}`);
    });
    it.each([[new point_class_1.Point(5, -1)], [new point_class_1.Point(5, imageHeight + 10)]])(`should reject on out of bounds y coordinates`, async (outOfBoundsPoint) => {
        // GIVEN
        const imageWidth = 10;
        const imageHeight = 20;
        const inputImage = new image_class_1.Image(imageWidth, imageHeight, Buffer.from([0, 0, 0]), 3, "input_image", 4, 4);
        const SUT = new jimp_image_processor_class_1.default();
        // WHEN
        const result = SUT.colorAt(inputImage, outOfBoundsPoint);
        // THEN
        await expect(result).rejects.toBe(`Query location out of bounds. Should be in range 0 <= y < image.height, is ${outOfBoundsPoint.y}`);
    });
});
//# sourceMappingURL=jimp-image-processor.class.spec.js.map