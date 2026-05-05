"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const match_request_class_1 = require("./match-request.class");
const image_class_1 = require("./image.class");
const region_class_1 = require("./region.class");
const sneer_1 = require("sneer");
const noop_log_provider_class_1 = require("./provider/log/noop-log-provider.class");
const match_result_class_1 = require("./match-result.class");
const dummyImage = new image_class_1.Image(0, 0, Buffer.of(0), 3, "dummy-needle", 0, 0);
const screenImage = new image_class_1.Image(0, 0, Buffer.of(0), 3, "dummy-screen-image", 0, 0);
const dummyRegion = new region_class_1.Region(0, 0, 0, 0);
beforeEach(() => {
    jest.clearAllMocks();
});
const imageFinderMock = {
    findMatch: jest.fn(),
    findMatches: jest.fn(),
};
const textFinderMock = {
    findMatch: jest.fn(),
    findMatches: jest.fn(),
};
const providerRegistryMock = (0, sneer_1.mockPartial)({
    getLogProvider() {
        return new noop_log_provider_class_1.NoopLogProvider();
    },
    getImageFinder() {
        return imageFinderMock;
    },
    getTextFinder() {
        return textFinderMock;
    },
});
describe("matchResults", () => {
    describe("getMatchResult", () => {
        it("should call the correct finder implementation for a given image match request", async () => {
            // GIVEN
            const imageMatchRequest = (0, match_request_class_1.createMatchRequest)(providerRegistryMock, dummyImage, dummyRegion, 0, screenImage);
            // WHEN
            await (0, match_result_class_1.getMatchResult)(providerRegistryMock, imageMatchRequest);
            // THEN
            expect(imageFinderMock.findMatch).toBeCalledTimes(1);
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
        ])("should all the correct finder implementation for a given text query", async (needle) => {
            // GIVEN
            const matchRequest = (0, match_request_class_1.createMatchRequest)(providerRegistryMock, needle, dummyRegion, 0, screenImage);
            // WHEN
            await (0, match_result_class_1.getMatchResult)(providerRegistryMock, matchRequest);
            // THEN
            expect(textFinderMock.findMatch).toBeCalledTimes(1);
        });
    });
    describe("getMatchResults", () => {
        it("should call the correct finder implementation for a given image match request", async () => {
            // GIVEN
            const imageMatchRequest = (0, match_request_class_1.createMatchRequest)(providerRegistryMock, dummyImage, dummyRegion, 0, screenImage);
            // WHEN
            await (0, match_result_class_1.getMatchResults)(providerRegistryMock, imageMatchRequest);
            // THEN
            expect(imageFinderMock.findMatches).toBeCalledTimes(1);
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
        ])("should all the correct finder implementation for a given text query", async (needle) => {
            // GIVEN
            const matchRequest = (0, match_request_class_1.createMatchRequest)(providerRegistryMock, needle, dummyRegion, 0, screenImage);
            // WHEN
            await (0, match_result_class_1.getMatchResults)(providerRegistryMock, matchRequest);
            // THEN
            expect(textFinderMock.findMatches).toBeCalledTimes(1);
        });
    });
});
//# sourceMappingURL=match-result.class.spec.js.map