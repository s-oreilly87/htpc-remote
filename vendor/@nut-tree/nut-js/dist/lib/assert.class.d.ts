import { Region } from "./region.class";
import { FindInput, ScreenClass } from "./screen.class";
export declare class AssertClass {
    private screen;
    constructor(screen: ScreenClass);
    isVisible(searchInput: FindInput | Promise<FindInput>, searchRegion?: Region | Promise<Region>, confidence?: number): Promise<void>;
    notVisible(searchInput: FindInput | Promise<FindInput>, searchRegion?: Region | Promise<Region>, confidence?: number): Promise<void>;
}
//# sourceMappingURL=assert.class.d.ts.map