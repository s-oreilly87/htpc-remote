"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const query_class_1 = require("./query.class");
const image_class_1 = require("./image.class");
const dummyImage = new image_class_1.Image(0, 0, Buffer.of(0), 3, "foo", 0, 0);
describe("query types", () => {
    it.each([
        [
            {
                id: "dummy",
                type: "text",
                by: {
                    word: "dummy-query",
                },
            },
            true,
        ],
        [
            {
                id: "dummy",
                type: "text",
                by: {
                    line: "dummy-query",
                },
            },
            true,
        ],
        [
            {
                id: "dummy",
                type: "foo",
                by: {
                    line: "dummy-query",
                },
            },
            false,
        ],
    ])("should correctly identify text queries", (query, expected) => {
        // GIVEN
        // WHEN
        const result = (0, query_class_1.isTextQuery)(query);
        // THEN
        expect(result).toBe(expected);
    });
    it.each([
        [
            {
                id: "dummy",
                type: "window",
                by: {
                    title: "dummy-query",
                },
            },
            true,
        ],
        [
            {
                id: "dummy",
                type: "foo",
                by: {
                    title: "dummy-query",
                },
            },
            false,
        ],
    ])("should correctly identify window queries", (query, expected) => {
        // GIVEN
        // WHEN
        const result = (0, query_class_1.isWindowQuery)(query);
        // THEN
        expect(result).toBe(expected);
    });
    it.each([
        [dummyImage, true],
        [
            {
                id: "dummy",
                type: "foo",
                by: {
                    title: "dummy-query",
                },
            },
            false,
        ],
    ])("should correctly identify image queries", (query, expected) => {
        // GIVEN
        // WHEN
        const result = (0, image_class_1.isImage)(query);
        // THEN
        expect(result).toBe(expected);
    });
});
//# sourceMappingURL=query.class.spec.js.map