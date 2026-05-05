"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchResult = exports.getMatchResults = exports.MatchResult = void 0;
const match_request_class_1 = require("./match-request.class");
class MatchResult {
    constructor(confidence, location, error) {
        this.confidence = confidence;
        this.location = location;
        this.error = error;
    }
}
exports.MatchResult = MatchResult;
async function getMatchResults(providerRegistry, matchRequest) {
    return (0, match_request_class_1.isImageMatchRequest)(matchRequest)
        ? providerRegistry.getImageFinder().findMatches(matchRequest)
        : providerRegistry.getTextFinder().findMatches(matchRequest);
}
exports.getMatchResults = getMatchResults;
async function getMatchResult(providerRegistry, matchRequest) {
    return (0, match_request_class_1.isImageMatchRequest)(matchRequest)
        ? providerRegistry.getImageFinder().findMatch(matchRequest)
        : providerRegistry.getTextFinder().findMatch(matchRequest);
}
exports.getMatchResult = getMatchResult;
//# sourceMappingURL=match-result.class.js.map