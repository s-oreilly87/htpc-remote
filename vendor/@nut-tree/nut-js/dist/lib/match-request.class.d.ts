import { Image } from "./image.class";
import { Region } from "./region.class";
import { OptionalSearchParameters } from "./optionalsearchparameters.class";
import { TextQuery } from "./query.class";
import { RegionResultFindInput } from "./screen.class";
import { ProviderRegistry } from "./provider/provider-registry.class";
export declare class MatchRequest<NEEDLE_TYPE, PROVIDER_DATA_TYPE> {
    readonly haystack: Image;
    readonly needle: NEEDLE_TYPE;
    readonly confidence: number;
    readonly providerData?: PROVIDER_DATA_TYPE | undefined;
    constructor(haystack: Image, needle: NEEDLE_TYPE, confidence: number, providerData?: PROVIDER_DATA_TYPE | undefined);
}
export declare function isImageMatchRequest<PROVIDER_DATA_TYPE>(matchRequest: any): matchRequest is MatchRequest<Image, PROVIDER_DATA_TYPE>;
export declare function isTextMatchRequest<PROVIDER_DATA_TYPE>(matchRequest: any): matchRequest is MatchRequest<TextQuery, PROVIDER_DATA_TYPE>;
export declare function createMatchRequest<PROVIDER_DATA_TYPE>(providerRegistry: ProviderRegistry, needle: TextQuery | Promise<TextQuery>, searchRegion: Region, minMatch: number, screenImage: Image, params?: OptionalSearchParameters<PROVIDER_DATA_TYPE>): MatchRequest<TextQuery, PROVIDER_DATA_TYPE>;
export declare function createMatchRequest<PROVIDER_DATA_TYPE>(providerRegistry: ProviderRegistry, needle: Image | Promise<Image>, searchRegion: Region, minMatch: number, screenImage: Image, params?: OptionalSearchParameters<PROVIDER_DATA_TYPE>): MatchRequest<Image, PROVIDER_DATA_TYPE>;
export declare function createMatchRequest<PROVIDER_DATA_TYPE>(providerRegistry: ProviderRegistry, needle: RegionResultFindInput | Promise<RegionResultFindInput>, searchRegion: Region, minMatch: number, screenImage: Image, params?: OptionalSearchParameters<PROVIDER_DATA_TYPE>): MatchRequest<TextQuery, PROVIDER_DATA_TYPE> | MatchRequest<Image, PROVIDER_DATA_TYPE>;
//# sourceMappingURL=match-request.class.d.ts.map