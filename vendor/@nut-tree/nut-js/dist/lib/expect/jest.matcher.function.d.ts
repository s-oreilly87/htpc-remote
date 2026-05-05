import { Point } from "../point.class";
import { Region } from "../region.class";
import { toBeAt } from "./matchers/toBeAt.function";
import { toBeIn } from "./matchers/toBeIn.function";
import { toShow } from "./matchers/toShow.function";
import { FindInput } from "../screen.class";
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeAt: (position: Point) => ReturnType<typeof toBeAt>;
            toBeIn: (region: Region) => ReturnType<typeof toBeIn>;
            toShow: (needle: FindInput, confidence?: number) => ReturnType<typeof toShow>;
        }
    }
}
export declare const jestMatchers: {
    toBeAt: (received: import("../mouse.class").MouseClass, position: Point) => Promise<{
        message: () => string;
        pass: boolean;
    }>;
    toBeIn: (received: import("../mouse.class").MouseClass, region: Region) => Promise<{
        message: () => string;
        pass: boolean;
    }>;
    toShow: (received: import("../screen.class").ScreenClass, needle: FindInput, confidence?: number | undefined) => Promise<{
        message: () => string;
        pass: boolean;
    }>;
};
//# sourceMappingURL=jest.matcher.function.d.ts.map