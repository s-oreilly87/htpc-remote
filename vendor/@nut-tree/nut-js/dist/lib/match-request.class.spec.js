"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const image_class_1 = require("./image.class");
const match_request_class_1 = require("./match-request.class");
const sneer_1 = require("sneer");
const noop_log_provider_class_1 = require("./provider/log/noop-log-provider.class");
const region_class_1 = require("./region.class");
beforeEach(() => {
    jest.clearAllMocks();
});
const providerRegistryMock = (0, sneer_1.mockPartial)({
    getLogProvider() {
        return new noop_log_provider_class_1.NoopLogProvider();
    },
});
const screenImage = new image_class_1.Image(0, 0, Buffer.of(0), 3, "dummy", 0, 0);
const dummyRegion = new region_class_1.Region(0, 0, 0, 0);
describe("MatchRequest", () => {
    it("should create an image match request for images", () => {
        // GIVEN
        const needle = new image_class_1.Image(0, 0, Buffer.of(0), 3, "dummy", 0, 0);
        // WHEN
        const matchRequest = (0, match_request_class_1.createMatchRequest)(providerRegistryMock, needle, dummyRegion, 0, screenImage);
        // THEN
        expect((0, match_request_class_1.isImageMatchRequest)(matchRequest)).toBeTruthy();
    });
    it.each([
        {
            id: "dummy",
            type: "text",
            by: {
                word: "dummy-query",
            },
        },
        {
            id: "dummy",
            type: "text",
            by: {
                line: "dummy-query",
            },
        },
    ])("should create a text match request for text queries", (needle) => {
        // GIVEN
        // WHEN
        const matchRequest = (0, match_request_class_1.createMatchRequest)(providerRegistryMock, needle, dummyRegion, 0, screenImage);
        // THEN
        expect((0, match_request_class_1.isTextMatchRequest)(matchRequest)).toBeTruthy();
    });
});
//# sourceMappingURL=match-request.class.spec.js.map