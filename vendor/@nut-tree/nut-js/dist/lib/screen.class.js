"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenClass = void 0;
const process_1 = require("process");
const file_type_enum_1 = require("./file-type.enum");
const generate_output_path_function_1 = require("./generate-output-path.function");
const match_request_class_1 = require("./match-request.class");
const match_result_class_1 = require("./match-result.class");
const region_class_1 = require("./region.class");
const timeout_function_1 = require("./util/timeout.function");
const image_class_1 = require("./image.class");
const point_class_1 = require("./point.class");
const query_class_1 = require("./query.class");
const window_class_1 = require("./window.class");
function validateSearchRegion(search, screen, providerRegistry) {
    providerRegistry
        .getLogProvider()
        .debug(`Validating search region: ${search}`);
    if (search.left < 0 ||
        search.top < 0 ||
        search.width < 0 ||
        search.height < 0) {
        const e = new Error(`Negative values in search region`);
        providerRegistry.getLogProvider().error(e, { region: search });
        throw e;
    }
    if (isNaN(search.left) ||
        isNaN(search.top) ||
        isNaN(search.width) ||
        isNaN(search.height)) {
        const e = new Error(`NaN values in search region`);
        providerRegistry.getLogProvider().error(e, { region: search });
        throw e;
    }
    if (search.width < 2 || search.height < 2) {
        const e = new Error(`Search region is not large enough. Must be at least two pixels in both width and height.`);
        providerRegistry.getLogProvider().error(e, { region: search });
        throw e;
    }
    if (search.left + search.width > screen.width ||
        search.top + search.height > screen.height) {
        const e = new Error(`Search region extends beyond screen boundaries (${screen.width}x${screen.height})`);
        providerRegistry.getLogProvider().error(e, { region: search, screen });
        throw e;
    }
}
/**
 * {@link ScreenClass} class provides methods to access screen content of a systems main display
 */
class ScreenClass {
    /**
     * {@link ScreenClass} class constructor
     * @param providerRegistry A {@link ProviderRegistry} used to access underlying implementations
     * @param findHooks A {@link Map} of {@link FindHookCallback} methods assigned to a template image
     */
    constructor(providerRegistry, findHooks = new Map()) {
        this.providerRegistry = providerRegistry;
        this.findHooks = findHooks;
        this.config = {
            confidence: 0.99,
            autoHighlight: false,
            highlightDurationMs: 500,
            highlightOpacity: 0.25,
            resourceDirectory: (0, process_1.cwd)(),
        };
    }
    /**
     * {@link width} returns the main screen width
     * This refers to the hardware resolution.
     * Screens with higher pixel density (e.g. retina displays in MacBooks) might have a higher width in in actual pixels
     */
    width() {
        this.providerRegistry.getLogProvider().debug(`Fetching screen width`);
        return this.providerRegistry.getScreen().screenWidth();
    }
    /**
     * {@link height} returns the main screen height
     * This refers to the hardware resolution.
     * Screens with higher pixel density (e.g. retina displays in MacBooks) might have a higher height in in actual pixels
     */
    height() {
        this.providerRegistry.getLogProvider().debug(`Fetching screen height`);
        return this.providerRegistry.getScreen().screenHeight();
    }
    async find(searchInput, params) {
        const needle = await searchInput;
        this.providerRegistry.getLogProvider().info(`Searching for ${needle}`);
        if (!(0, image_class_1.isImage)(needle) && !(0, query_class_1.isTextQuery)(needle) && !(0, query_class_1.isWindowQuery)(needle)) {
            const e = Error(`find requires an Image, a text query or a window query, but received ${JSON.stringify(needle)}`);
            this.providerRegistry.getLogProvider().error(e, { needle });
            throw e;
        }
        try {
            if ((0, query_class_1.isWindowQuery)(needle)) {
                this.providerRegistry.getLogProvider().debug(`Running a window search`);
                const windowHandle = await this.providerRegistry
                    .getWindowFinder()
                    .findMatch(needle);
                const window = new window_class_1.Window(this.providerRegistry, windowHandle);
                const possibleHooks = this.getHooksForInput(needle) || [];
                this.providerRegistry
                    .getLogProvider()
                    .debug(`${possibleHooks.length} hooks triggered for match`);
                for (const hook of possibleHooks) {
                    this.providerRegistry.getLogProvider().debug(`Executing hook`);
                    await hook(window);
                }
                return window;
            }
            else {
                this.logNeedleType(needle);
                const { minMatch, screenSize, searchRegion, screenImage } = await this.getFindParameters(params);
                const matchRequest = (0, match_request_class_1.createMatchRequest)(this.providerRegistry, needle, searchRegion, minMatch, screenImage, params);
                validateSearchRegion(searchRegion, screenSize, this.providerRegistry);
                this.providerRegistry.getLogProvider().debug(`Search region is valid`);
                const matchResult = await (0, match_result_class_1.getMatchResult)(this.providerRegistry, matchRequest);
                this.providerRegistry
                    .getLogProvider()
                    .debug("Found match!", matchResult);
                const possibleHooks = this.getHooksForInput(needle) || [];
                this.providerRegistry
                    .getLogProvider()
                    .debug(`${possibleHooks.length} hooks triggered for match`);
                for (const hook of possibleHooks) {
                    this.providerRegistry.getLogProvider().debug(`Executing hook`);
                    await hook(matchResult);
                }
                const resultRegion = new region_class_1.Region(searchRegion.left + matchResult.location.left, searchRegion.top + matchResult.location.top, matchResult.location.width, matchResult.location.height);
                this.providerRegistry
                    .getLogProvider()
                    .info(`Match is located at ${resultRegion.toString()}`);
                if (this.config.autoHighlight) {
                    this.providerRegistry
                        .getLogProvider()
                        .debug(`Autohighlight is enabled`);
                    return this.highlight(resultRegion);
                }
                else {
                    return resultRegion;
                }
            }
        }
        catch (e) {
            const error = new Error(`Searching for ${needle.id} failed. Reason: '${e}'`);
            this.providerRegistry.getLogProvider().error(error);
            throw error;
        }
    }
    async findAll(searchInput, params) {
        const needle = await searchInput;
        this.providerRegistry.getLogProvider().info(`Searching for ${needle}`);
        if (!(0, image_class_1.isImage)(needle) && !(0, query_class_1.isTextQuery)(needle) && !(0, query_class_1.isWindowQuery)(needle)) {
            const e = Error(`findAll requires an Image, a text query or a window query, but received ${JSON.stringify(needle)}`);
            this.providerRegistry.getLogProvider().error(e, { needle });
            throw e;
        }
        try {
            if ((0, query_class_1.isWindowQuery)(needle)) {
                this.providerRegistry.getLogProvider().debug(`Running a window search`);
                const matches = await this.providerRegistry
                    .getWindowFinder()
                    .findMatches(needle);
                const windows = matches.map((windowHandle) => new window_class_1.Window(this.providerRegistry, windowHandle));
                const possibleHooks = this.getHooksForInput(needle) || [];
                this.providerRegistry
                    .getLogProvider()
                    .debug(`${possibleHooks.length} hooks triggered for ${windows.length} matches`);
                for (const hook of possibleHooks) {
                    for (const wnd of windows) {
                        this.providerRegistry.getLogProvider().debug(`Executing hook`);
                        await hook(wnd);
                    }
                }
                return windows;
            }
            else {
                this.logNeedleType(needle);
                const { minMatch, screenSize, searchRegion, screenImage } = await this.getFindParameters(params);
                const matchRequest = (0, match_request_class_1.createMatchRequest)(this.providerRegistry, needle, searchRegion, minMatch, screenImage, params);
                validateSearchRegion(searchRegion, screenSize, this.providerRegistry);
                this.providerRegistry.getLogProvider().debug(`Search region is valid`);
                const matchResults = await (0, match_result_class_1.getMatchResults)(this.providerRegistry, matchRequest);
                const possibleHooks = this.getHooksForInput(needle) || [];
                this.providerRegistry
                    .getLogProvider()
                    .debug(`${possibleHooks.length} hooks triggered for ${matchResults.length} matches`);
                for (const hook of possibleHooks) {
                    for (const matchResult of matchResults) {
                        this.providerRegistry.getLogProvider().debug(`Executing hook`);
                        await hook(matchResult);
                    }
                }
                const resultRegions = matchResults.map((matchResult) => {
                    const resultRegion = new region_class_1.Region(searchRegion.left + matchResult.location.left, searchRegion.top + matchResult.location.top, matchResult.location.width, matchResult.location.height);
                    this.providerRegistry
                        .getLogProvider()
                        .info(`Match is located at ${resultRegion.toString()}`);
                    return resultRegion;
                });
                if (this.config.autoHighlight) {
                    this.providerRegistry
                        .getLogProvider()
                        .debug(`Autohighlight is enabled`);
                    resultRegions.forEach((region) => this.highlight(region));
                    return resultRegions;
                }
                else {
                    return resultRegions;
                }
            }
        }
        catch (e) {
            const error = new Error(`Searching for ${needle.id} failed. Reason: '${e}'`);
            this.providerRegistry.getLogProvider().error(error);
            throw error;
        }
    }
    /**
     * {@link highlight} highlights a screen {@link Region} for a certain duration by overlaying it with an opaque highlight window
     * @param regionToHighlight The {@link Region} to highlight
     */
    async highlight(regionToHighlight) {
        const highlightRegion = await regionToHighlight;
        if (!(0, region_class_1.isRegion)(highlightRegion)) {
            const e = Error(`highlight requires an Region, but received ${JSON.stringify(highlightRegion)}`);
            this.providerRegistry.getLogProvider().error(e);
            throw e;
        }
        this.providerRegistry
            .getLogProvider()
            .info(`Highlighting ${highlightRegion.toString()} for ${this.config.highlightDurationMs / 1000} with ${this.config.highlightOpacity * 100}% opacity`);
        await this.providerRegistry
            .getScreen()
            .highlightScreenRegion(highlightRegion, this.config.highlightDurationMs, this.config.highlightOpacity);
        return highlightRegion;
    }
    async waitFor(searchInput, timeoutMs, updateInterval, params) {
        const needle = await searchInput;
        const timeoutValue = timeoutMs !== null && timeoutMs !== void 0 ? timeoutMs : 5000;
        const updateIntervalValue = updateInterval !== null && updateInterval !== void 0 ? updateInterval : 500;
        if (!(0, image_class_1.isImage)(needle) && !(0, query_class_1.isTextQuery)(needle) && !(0, query_class_1.isWindowQuery)(needle)) {
            const e = Error(`waitFor requires an Image, a text query or a window query, but received ${JSON.stringify(searchInput)}`);
            this.providerRegistry.getLogProvider().error(e);
            throw e;
        }
        this.providerRegistry
            .getLogProvider()
            .info(`Waiting for ${needle.id} to appear on screen. Timeout: ${timeoutValue / 1000} seconds, interval: ${updateIntervalValue} ms`);
        return (0, timeout_function_1.timeout)(updateIntervalValue, timeoutValue, () => {
            return this.find(needle, params);
        }, {
            signal: params === null || params === void 0 ? void 0 : params.abort,
        });
    }
    on(searchInput, callback) {
        if (!(0, image_class_1.isImage)(searchInput) &&
            !(0, query_class_1.isTextQuery)(searchInput) &&
            !(0, query_class_1.isWindowQuery)(searchInput)) {
            const e = new Error(`on requires an Image, a text query or a window query, but received ${JSON.stringify(searchInput)}`);
            this.providerRegistry.getLogProvider().error(e);
            throw e;
        }
        const existingHooks = this.findHooks.get(searchInput) || [];
        this.findHooks.set(searchInput, [...existingHooks, callback]);
        this.providerRegistry
            .getLogProvider()
            .info(`Registered callback for image ${searchInput.id}. There are currently ${existingHooks.length + 1} hooks registered`);
    }
    /**
     * {@link capture} captures a screenshot of a systems main display
     * @param fileName Basename for the generated screenshot
     * @param fileFormat The {@link FileType} for the generated screenshot
     * @param filePath The output path for the generated screenshot (Default: {@link cwd})
     * @param fileNamePrefix Filename prefix for the generated screenshot (Default: empty)
     * @param fileNamePostfix Filename postfix for the generated screenshot (Default: empty)
     */
    async capture(fileName, fileFormat = file_type_enum_1.FileType.PNG, filePath = (0, process_1.cwd)(), fileNamePrefix = "", fileNamePostfix = "") {
        const currentScreen = await this.providerRegistry.getScreen().grabScreen();
        if (!(0, image_class_1.isImage)(currentScreen)) {
            const e = new Error(`capture requires an Image, but received ${JSON.stringify(currentScreen)}`);
            this.providerRegistry.getLogProvider().error(e);
            throw e;
        }
        this.providerRegistry
            .getLogProvider()
            .info(`Capturing whole screen (0, 0, ${currentScreen.width}, ${currentScreen.height})`);
        return this.saveImage(currentScreen, fileName, fileFormat, filePath, fileNamePrefix, fileNamePostfix);
    }
    /**
     * {@link grab} grabs screen content of a systems main display
     */
    async grab() {
        const currentScreen = await this.providerRegistry.getScreen().grabScreen();
        this.providerRegistry
            .getLogProvider()
            .info(`Grabbed whole screen (0, 0, ${currentScreen.width}, ${currentScreen.height})`);
        return currentScreen;
    }
    /**
     * {@link captureRegion} captures a screenshot of a region on the systems main display
     * @param fileName Basename for the generated screenshot
     * @param regionToCapture The region of the screen to capture in the screenshot
     * @param fileFormat The {@link FileType} for the generated screenshot
     * @param filePath The output path for the generated screenshot (Default: {@link cwd})
     * @param fileNamePrefix Filename prefix for the generated screenshot (Default: empty)
     * @param fileNamePostfix Filename postfix for the generated screenshot (Default: empty)
     */
    async captureRegion(fileName, regionToCapture, fileFormat = file_type_enum_1.FileType.PNG, filePath = (0, process_1.cwd)(), fileNamePrefix = "", fileNamePostfix = "") {
        const targetRegion = await regionToCapture;
        if (!(0, region_class_1.isRegion)(targetRegion)) {
            const e = new Error(`captureRegion requires an Region, but received ${JSON.stringify(targetRegion)}`);
            this.providerRegistry.getLogProvider().error(e);
            throw e;
        }
        this.providerRegistry
            .getLogProvider()
            .info(`Capturing screen region ${targetRegion.toString()}`);
        const regionImage = await this.providerRegistry
            .getScreen()
            .grabScreenRegion(targetRegion);
        if (!(0, image_class_1.isImage)(regionImage)) {
            const e = new Error(`captureRegion requires an Image, but received ${JSON.stringify(regionImage)}`);
            this.providerRegistry.getLogProvider().error(e);
            throw e;
        }
        return this.saveImage(regionImage, fileName, fileFormat, filePath, fileNamePrefix, fileNamePostfix);
    }
    /**
     * {@link grabRegion} grabs screen content of a region on the systems main display
     * @param regionToGrab The screen region to grab
     */
    async grabRegion(regionToGrab) {
        const targetRegion = await regionToGrab;
        if (!(0, region_class_1.isRegion)(targetRegion)) {
            const e = new Error(`grabRegion requires an Region, but received ${JSON.stringify(targetRegion)}`);
            this.providerRegistry.getLogProvider().error(e);
            throw e;
        }
        const screenContent = await this.providerRegistry
            .getScreen()
            .grabScreenRegion(targetRegion);
        this.providerRegistry
            .getLogProvider()
            .info(`Grabbed screen region ${targetRegion.toString()}`);
        return screenContent;
    }
    /**
     * {@link colorAt} returns RGBA color values for a certain pixel at {@link Point} p
     * @param point Location to query color information from
     */
    async colorAt(point) {
        const screenContent = await this.providerRegistry.getScreen().grabScreen();
        const inputPoint = await point;
        if (!(0, point_class_1.isPoint)(inputPoint)) {
            const e = new Error(`colorAt requires a Point, but received ${JSON.stringify(inputPoint)}`);
            this.providerRegistry.getLogProvider().error(e);
            throw e;
        }
        const scaledPoint = new point_class_1.Point(inputPoint.x * screenContent.pixelDensity.scaleX, inputPoint.y * screenContent.pixelDensity.scaleY);
        this.providerRegistry
            .getLogProvider()
            .debug(`Point ${inputPoint.toString()} has been scaled by (${screenContent.pixelDensity.scaleX}, ${screenContent.pixelDensity.scaleY}) into ${scaledPoint.toString()}`);
        const color = await this.providerRegistry
            .getImageProcessor()
            .colorAt(screenContent, scaledPoint);
        this.providerRegistry
            .getLogProvider()
            .info(`Color at ${inputPoint.toString()} is ${color.toString()}`);
        return color;
    }
    async saveImage(image, fileName, fileFormat, filePath, fileNamePrefix, fileNamePostfix) {
        const outputPath = (0, generate_output_path_function_1.generateOutputPath)(fileName, {
            path: filePath,
            postfix: fileNamePostfix,
            prefix: fileNamePrefix,
            type: fileFormat,
        });
        this.providerRegistry
            .getLogProvider()
            .info(`Writing image to ${outputPath}`);
        await this.providerRegistry
            .getImageWriter()
            .store({ image, path: outputPath });
        this.providerRegistry.getLogProvider().debug(`File written`);
        return outputPath;
    }
    async getFindParameters(params) {
        var _a, _b;
        const minMatch = (_a = params === null || params === void 0 ? void 0 : params.confidence) !== null && _a !== void 0 ? _a : this.config.confidence;
        const screenSize = await this.providerRegistry.getScreen().screenSize();
        const searchRegion = (_b = (await (params === null || params === void 0 ? void 0 : params.searchRegion))) !== null && _b !== void 0 ? _b : screenSize;
        const screenImage = await this.providerRegistry
            .getScreen()
            .grabScreenRegion(searchRegion);
        const findParameters = {
            minMatch,
            screenSize,
            searchRegion,
            screenImage,
        };
        this.providerRegistry
            .getLogProvider()
            .debug(`Running on-screen search with parameters`, {
            minMatch,
            screenSize,
            searchRegion,
        });
        return findParameters;
    }
    getHooksForInput(input) {
        if ((0, image_class_1.isImage)(input) || (0, query_class_1.isTextQuery)(input)) {
            return this.findHooks.get(input);
        }
        else if ((0, query_class_1.isWindowQuery)(input)) {
            return this.findHooks.get(input);
        }
        return [];
    }
    logNeedleType(needle) {
        if ((0, image_class_1.isImage)(needle)) {
            this.providerRegistry.getLogProvider().debug(`Running an image search`);
        }
        else if ((0, query_class_1.isTextQuery)(needle)) {
            this.providerRegistry.getLogProvider().debug(`Running a text search`);
        }
    }
}
exports.ScreenClass = ScreenClass;
//# sourceMappingURL=screen.class.js.map