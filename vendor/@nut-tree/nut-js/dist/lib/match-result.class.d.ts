import { Region } from "./region.class";
import { MatchRequest } from "./match-request.class";
import { ProviderRegistry } from "./provider/provider-registry.class";
import { Image } from "./image.class";
import { TextQuery } from "./query.class";
export declare class MatchResult {
    readonly confidence: number;
    readonly location: Region;
    readonly error?: Error | undefined;
    constructor(confidence: number, location: Region, error?: Error | undefined);
}
export declare function getMatchResults<PROVIDER_DATA_TYPE>(providerRegistry: ProviderRegistry, matchRequest: MatchRequest<TextQuery, PROVIDER_DATA_TYPE>): Promise<MatchResult[]>;
export declare function getMatchResults<PROVIDER_DATA_TYPE>(providerRegistry: ProviderRegistry, matchRequest: MatchRequest<Image, PROVIDER_DATA_TYPE>): Promise<MatchResult[]>;
export declare function getMatchResults<PROVIDER_DATA_TYPE>(providerRegistry: ProviderRegistry, matchRequest: MatchRequest<Image, PROVIDER_DATA_TYPE> | MatchRequest<TextQuery, PROVIDER_DATA_TYPE>): Promise<MatchResult[]>;
export declare function getMatchResult<PROVIDER_DATA_TYPE>(providerRegistry: ProviderRegistry, matchRequest: MatchRequest<TextQuery, PROVIDER_DATA_TYPE>): Promise<MatchResult>;
export declare function getMatchResult<PROVIDER_DATA_TYPE>(providerRegistry: ProviderRegistry, matchRequest: MatchRequest<Image, PROVIDER_DATA_TYPE>): Promise<MatchResult>;
export declare function getMatchResult<PROVIDER_DATA_TYPE>(providerRegistry: ProviderRegistry, matchRequest: MatchRequest<Image, PROVIDER_DATA_TYPE> | MatchRequest<TextQuery, PROVIDER_DATA_TYPE>): Promise<MatchResult>;
//# sourceMappingURL=match-result.class.d.ts.map