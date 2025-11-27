// Minimal stub of @types/react to satisfy local TypeScript usage without network access.
export type Key = string | number | symbol;

export interface ReactElement<P = any, T = any> {
  type: T;
  props: P;
  key: Key | null;
}

export type ReactNode = ReactElement | string | number | boolean | null | undefined | ReactNode[];

export type PropsWithChildren<P = unknown> = P & { children?: ReactNode };

export interface FunctionComponent<P = {}> {
  (props: PropsWithChildren<P>): ReactElement | null;
}
export type FC<P = {}> = FunctionComponent<P>;

export type SetStateAction<S> = S | ((prevState: S) => S);
export type Dispatch<A> = (value: A) => void;

export interface SyntheticEvent<T = Element> {
  target: T;
  currentTarget: T;
  preventDefault(): void;
  stopPropagation(): void;
}

export interface MouseEvent<T = Element> extends SyntheticEvent<T> {
  clientX: number;
  clientY: number;
}

export interface Touch {
  clientX: number;
  clientY: number;
}

export interface TouchEvent<T = Element> extends SyntheticEvent<T> {
  touches: Touch[];
  changedTouches: Touch[];
}

export interface HTMLAttributes<T> {
  onClick?: (event: MouseEvent<T>) => void;
}

export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onMouseDown?: (event: MouseEvent<T>) => void;
  onMouseUp?: (event: MouseEvent<T>) => void;
  onTouchStart?: (event: TouchEvent<T>) => void;
  onTouchEnd?: (event: TouchEvent<T>) => void;
}

export interface DetailedHTMLProps<E, T> extends E {
  ref?: Ref<T>;
}

export interface RefObject<T> {
  readonly current: T | null;
}
export type RefCallback<T> = (instance: T | null) => void;
export type Ref<T> = RefCallback<T> | RefObject<T> | null;

export interface Context<T> {
  Provider: FC<{ value: T }>;
  Consumer: FC<{ value: T }>;
  _currentValue?: T;
}

export function createElement(type: any, props: any, ...children: ReactNode[]): ReactElement;
export function createContext<T>(defaultValue: T): Context<T>;
export function useContext<T>(context: Context<T>): T;
export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
export function useRef<T>(initialValue: T | null): RefObject<T>;
export function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: readonly any[]): T;
export function useMemo<T>(factory: () => T, deps?: readonly any[]): T;

export function forwardRef<T, P = {}>(render: (props: P, ref: Ref<T>) => ReactElement | null): (props: P & { ref?: Ref<T> }) => ReactElement | null;

export const Fragment: FC<{ children?: ReactNode }>;

export interface CSSProperties {
  [key: string]: string | number | undefined;
}

export interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
  style?: CSSProperties;
}

export namespace JSX {
  interface Element extends ReactElement {}
  interface ElementClass {
    render: any;
  }
  interface ElementAttributesProperty {
    props: any;
  }
  interface ElementChildrenAttribute {
    children: {}; // specify children name to use
  }
  interface IntrinsicAttributes {
    key?: Key | null;
  }
  interface IntrinsicClassAttributes<T> {
    ref?: Ref<T>;
  }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export interface MouseEventHandler<T = Element> {
  (event: MouseEvent<T>): void;
}
export interface TouchEventHandler<T = Element> {
  (event: TouchEvent<T>): void;
}

export interface HTMLButtonElement {}
