import { FileType } from "./file-type.enum";
import { MatchResult } from "./match-result.class";
import { Region } from "./region.class";
import { Image } from "./image.class";
import { ProviderRegistry } from "./provider/provider-registry.class";
import { Point } from "./point.class";
import { OptionalSearchParameters } from "./optionalsearchparameters.class";
import { LineQuery, WindowQuery, WordQuery } from "./query.class";
import { Window } from "./window.class";
export declare type WindowCallback = (target: Window) => void | Promise<void>;
export declare type MatchResultCallback = (target: MatchResult) => void | Promise<void>;
export declare type FindHookCallback = WindowCallback | MatchResultCallback;
/**
 * Config object for {@link ScreenClass} class
 */
export interface ScreenConfig {
    /**
     * Configures the required matching percentage for template images to be declared as a match
     */
    confidence: number;
    /**
     * Configure whether to auto highlight all search results or not
     */
    autoHighlight: boolean;
    /**
     * Configure highlighting duration
     */
    highlightDurationMs: number;
    /**
     * Configure opacity of highlight window
     */
    highlightOpacity: number;
    /**
     * Configures the path from which template images are loaded from
     */
    resourceDirectory: string;
}
export declare type RegionResultFindInput = Image | WordQuery | LineQuery;
export declare type WindowResultFindInput = WindowQuery;
export declare type FindInput = RegionResultFindInput | WindowResultFindInput;
export declare type FindResult = Region | Window;
/**
 * {@link ScreenClass} class provides methods to access screen content of a systems main display
 */
export declare class ScreenClass {
    private providerRegistry;
    private findHooks;
    config: ScreenConfig;
    /**
     * {@link ScreenClass} class constructor
     * @param providerRegistry A {@link ProviderRegistry} used to access underlying implementations
     * @param findHooks A {@link Map} of {@link FindHookCallback} methods assigned to a template image
     */
    constructor(providerRegistry: ProviderRegistry, findHooks?: Map<FindInput, FindHookCallback[]>);
    /**
     * {@link width} returns the main screen width
     * This refers to the hardware resolution.
     * Screens with higher pixel density (e.g. retina displays in MacBooks) might have a higher width in in actual pixels
     */
    width(): Promise<number>;
    /**
     * {@link height} returns the main screen height
     * This refers to the hardware resolution.
     * Screens with higher pixel density (e.g. retina displays in MacBooks) might have a higher height in in actual pixels
     */
    height(): Promise<number>;
    /**
     * {@link find} will search for a single occurrence of a given search input on a systems main screen
     * @param searchInput A {@link FindInput} instance
     * @param params {@link OptionalSearchParameters} which are used to fine tune search region and / or match confidence
     */
    find<PROVIDER_DATA_TYPE>(searchInput: RegionResultFindInput | Promise<RegionResultFindInput>, params?: OptionalSearchParameters<PROVIDER_DATA_TYPE>): Promise<Region>;
    find<PROVIDER_DATA_TYPE>(searchInput: WindowResultFindInput | Promise<WindowResultFindInput>, params?: OptionalSearchParameters<PROVIDER_DATA_TYPE>): Promise<Window>;
    find<PROVIDER_DATA_TYPE>(searchInput: FindInput | Promise<FindInput>, params?: OptionalSearchParameters<PROVIDER_DATA_TYPE>): Promise<FindResult>;
    /**
     * {@link findAll} will search for every occurrence of a given search input on a systems main screen
     * @param searchInput A {@link FindInput} instance to search for
     * @param params {@link OptionalSearchParameters} which are used to fine tune search region and / or match confidence
     */
    findAll<PROVIDER_DATA_TYPE>(searchInput: RegionResultFindInput | Promise<RegionResultFindInput>, params?: OptionalSearchParameters<PROVIDER_DATA_TYPE>): Promise<Region[]>;
    findAll<PROVIDER_DATA_TYPE>(searchInput: WindowResultFindInput | Promise<WindowResultFindInput>, params?: OptionalSearchParameters<PROVIDER_DATA_TYPE>): Promise<Window[]>;
    /**
     * {@link highlight} highlights a screen {@link Region} for a certain duration by overlaying it with an opaque highlight window
     * @param regionToHighlight The {@link Region} to highlight
     */
    highlight(regionToHighlight: Region | Promise<Region>): Promise<Region>;
    /**
     * {@link waitFor} searches for a template image for a specified duration
     * @param searchInput Filename of the template image, relative to {@link ScreenClass.config.resourceDirectory}, or an {@link Image}
     * @param timeoutMs Timeout in milliseconds after which {@link waitFor} fails
     * @param updateInterval Update interval in milliseconds to retry search
     * @param params {@link OptionalSearchParameters} which are used to fine tune search region and / or match confidence
     */
    waitFor<PROVIDER_DATA_TYPE>(searchInput: RegionResultFindInput | Promise<RegionResultFindInput>, timeoutMs?: number, updateInterval?: number, params?: OptionalSearchParameters<PROVIDER_DATA_TYPE>): Promise<Region>;
    waitFor<PROVIDER_DATA_TYPE>(searchInput: WindowResultFindInput | Promise<WindowResultFindInput>, timeoutMs?: number, updateInterval?: number, params?: OptionalSearchParameters<PROVIDER_DATA_TYPE>): Promise<Window>;
    /**
     * {@link on} registers a callback which is triggered once a certain searchInput image is found
     * @param searchInput to trigger the callback on
     * @param callback The {@link FindHookCallback} function to trigger
     */
    on(searchInput: WindowResultFindInput, callback: WindowCallback): void;
    on(searchInput: RegionResultFindInput, callback: MatchResultCallback): void;
    /**
     * {@link capture} captures a screenshot of a systems main display
     * @param fileName Basename for the generated screenshot
     * @param fileFormat The {@link FileType} for the generated screenshot
     * @param filePath The output path for the generated screenshot (Default: {@link cwd})
     * @param fileNamePrefix Filename prefix for the generated screenshot (Default: empty)
     * @param fileNamePostfix Filename postfix for the generated screenshot (Default: empty)
     */
    capture(fileName: string, fileFormat?: FileType, filePath?: string, fileNamePrefix?: string, fileNamePostfix?: string): Promise<string>;
    /**
     * {@link grab} grabs screen content of a systems main display
     */
    grab(): Promise<Image>;
    /**
     * {@link captureRegion} captures a screenshot of a region on the systems main display
     * @param fileName Basename for the generated screenshot
     * @param regionToCapture The region of the screen to capture in the screenshot
     * @param fileFormat The {@link FileType} for the generated screenshot
     * @param filePath The output path for the generated screenshot (Default: {@link cwd})
     * @param fileNamePrefix Filename prefix for the generated screenshot (Default: empty)
     * @param fileNamePostfix Filename postfix for the generated screenshot (Default: empty)
     */
    captureRegion(fileName: string, regionToCapture: Region | Promise<Region>, fileFormat?: FileType, filePath?: string, fileNamePrefix?: string, fileNamePostfix?: string): Promise<string>;
    /**
     * {@link grabRegion} grabs screen content of a region on the systems main display
     * @param regionToGrab The screen region to grab
     */
    grabRegion(regionToGrab: Region | Promise<Region>): Promise<Image>;
    /**
     * {@link colorAt} returns RGBA color values for a certain pixel at {@link Point} p
     * @param point Location to query color information from
     */
    colorAt(point: Point | Promise<Point>): Promise<import("./rgba.class").RGBA>;
    private saveImage;
    private getFindParameters;
    private getHooksForInput;
    private logNeedleType;
}
//# sourceMappingURL=screen.class.d.ts.map