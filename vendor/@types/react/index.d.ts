// Local vendored copy of @types/react for offline environments.
// This mirrors the common pieces of the official React 18 type surface used in the project.
export type Key = string | number | symbol;

export interface Attributes {
  key?: Key | null;
}

export interface RefObject<T> {
  readonly current: T | null;
}
export type RefCallback<T> = (instance: T | null) => void;
export type Ref<T> = RefCallback<T> | RefObject<T> | null;
export type LegacyRef<T> = Ref<T> | string;

export type SetStateAction<S> = S | ((prevState: S) => S);
export type Dispatch<A> = (value: A) => void;

export interface ReactElement<P = any, T = any> {
  type: T;
  props: P;
  key: Key | null;
}

export type ReactNode =
  | ReactElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ReactNode[];

export type PropsWithChildren<P = unknown> = P & { children?: ReactNode };

export interface FunctionComponent<P = {}> {
  (props: PropsWithChildren<P>, context?: any): ReactElement | null;
  propTypes?: any;
  contextTypes?: any;
  defaultProps?: Partial<P>;
  displayName?: string;
}
export type FC<P = {}> = FunctionComponent<P>;

export type ComponentType<P = {}> = FunctionComponent<P>;

export interface ProviderProps<T> {
  value: T;
  children?: ReactNode;
}
export interface ConsumerProps<T> {
  children: (value: T) => ReactNode;
}
export interface Context<T> {
  Provider: FC<ProviderProps<T>>;
  Consumer: FC<ConsumerProps<T>>;
  _currentValue?: T;
}

export function createElement(type: any, props: any, ...children: ReactNode[]): ReactElement;
export function createContext<T>(defaultValue: T): Context<T>;
export function useContext<T>(context: Context<T>): T;
export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
export function useLayoutEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
export function useRef<T>(initialValue: T | null): RefObject<T>;
export function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: readonly any[]): T;
export function useMemo<T>(factory: () => T, deps?: readonly any[]): T;
export function forwardRef<T, P = {}>(render: (props: P, ref: Ref<T>) => ReactElement | null): (props: P & { ref?: Ref<T> }) => ReactElement | null;

// Events
export interface SyntheticEvent<T = Element> {
  target: T;
  currentTarget: T;
  preventDefault(): void;
  stopPropagation(): void;
}

export interface ClipboardEvent<T = Element> extends SyntheticEvent<T> {
  clipboardData: DataTransfer;
}

export interface FocusEvent<T = Element> extends SyntheticEvent<T> {
  relatedTarget: EventTarget | null;
}

export interface FormEvent<T = Element> extends SyntheticEvent<T> {}

export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
  target: T;
}

export interface KeyboardEvent<T = Element> extends SyntheticEvent<T> {
  altKey: boolean;
  charCode: number;
  ctrlKey: boolean;
  key: string;
  keyCode: number;
  metaKey: boolean;
  shiftKey: boolean;
}

export interface MouseEvent<T = Element> extends SyntheticEvent<T> {
  altKey: boolean;
  button: number;
  clientX: number;
  clientY: number;
  ctrlKey: boolean;
  metaKey: boolean;
  movementX: number;
  movementY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  shiftKey: boolean;
}

export interface Touch {
  clientX: number;
  clientY: number;
  identifier: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  target: EventTarget;
}

export interface TouchList {
  length: number;
  item(index: number): Touch | null;
  [index: number]: Touch;
}

export interface TouchEvent<T = Element> extends SyntheticEvent<T> {
  altKey: boolean;
  changedTouches: TouchList;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  targetTouches: TouchList;
  touches: TouchList;
}

export interface WheelEvent<T = Element> extends MouseEvent<T> {
  deltaMode: number;
  deltaX: number;
  deltaY: number;
  deltaZ: number;
}

export interface PointerEvent<T = Element> extends MouseEvent<T> {
  pointerId: number;
  pressure: number;
  tangentialPressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  width: number;
  height: number;
  pointerType: 'mouse' | 'pen' | 'touch' | string;
  isPrimary: boolean;
}

export interface UIEvent<T = Element> extends SyntheticEvent<T> {
  detail: number;
  view: AbstractView;
}

export interface CompositionEvent<T = Element> extends SyntheticEvent<T> {
  data: string;
}

export interface DragEvent<T = Element> extends MouseEvent<T> {
  dataTransfer: DataTransfer | null;
}

export interface AnimationEvent<T = Element> extends SyntheticEvent<T> {
  animationName: string;
  elapsedTime: number;
}

export interface TransitionEvent<T = Element> extends SyntheticEvent<T> {
  propertyName: string;
  elapsedTime: number;
}

export interface BaseSyntheticEvent<E = object, C = any, T = any> extends SyntheticEvent<T> {
  nativeEvent: E;
  target: T;
  currentTarget: C;
}

// Event handlers
export interface EventHandler<E extends SyntheticEvent<any>> {
  (event: E): void;
}
export interface AnimationEventHandler<T = Element> extends EventHandler<AnimationEvent<T>> {}
export interface ClipboardEventHandler<T = Element> extends EventHandler<ClipboardEvent<T>> {}
export interface CompositionEventHandler<T = Element> extends EventHandler<CompositionEvent<T>> {}
export interface DragEventHandler<T = Element> extends EventHandler<DragEvent<T>> {}
export interface FocusEventHandler<T = Element> extends EventHandler<FocusEvent<T>> {}
export interface FormEventHandler<T = Element> extends EventHandler<FormEvent<T>> {}
export interface ChangeEventHandler<T = Element> extends EventHandler<ChangeEvent<T>> {}
export interface KeyboardEventHandler<T = Element> extends EventHandler<KeyboardEvent<T>> {}
export interface MouseEventHandler<T = Element> extends EventHandler<MouseEvent<T>> {}
export interface TouchEventHandler<T = Element> extends EventHandler<TouchEvent<T>> {}
export interface WheelEventHandler<T = Element> extends EventHandler<WheelEvent<T>> {}
export interface PointerEventHandler<T = Element> extends EventHandler<PointerEvent<T>> {}
export interface UIEventHandler<T = Element> extends EventHandler<UIEvent<T>> {}

// Attributes
export interface AriaAttributes {
  'aria-label'?: string;
  'aria-live'?: 'off' | 'assertive' | 'polite';
  'aria-atomic'?: boolean | 'true' | 'false';
  'aria-busy'?: boolean | 'true' | 'false';
  'aria-checked'?: boolean | 'true' | 'false' | 'mixed';
  'aria-describedby'?: string;
  'aria-details'?: string;
  'aria-disabled'?: boolean | 'true' | 'false';
  'aria-expanded'?: boolean | 'true' | 'false';
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-labelledby'?: string;
  'aria-pressed'?: boolean | 'true' | 'false' | 'mixed';
  'aria-selected'?: boolean | 'true' | 'false';
}

export interface DOMAttributes<T = Element> {
  children?: ReactNode;

  onCopy?: ClipboardEventHandler<T>;
  onCut?: ClipboardEventHandler<T>;
  onPaste?: ClipboardEventHandler<T>;

  onCompositionEnd?: CompositionEventHandler<T>;
  onCompositionStart?: CompositionEventHandler<T>;
  onCompositionUpdate?: CompositionEventHandler<T>;

  onFocus?: FocusEventHandler<T>;
  onBlur?: FocusEventHandler<T>;

  onChange?: ChangeEventHandler<T>;
  onInput?: FormEventHandler<T>;
  onReset?: FormEventHandler<T>;
  onSubmit?: FormEventHandler<T>;

  onKeyDown?: KeyboardEventHandler<T>;
  onKeyPress?: KeyboardEventHandler<T>;
  onKeyUp?: KeyboardEventHandler<T>;

  onClick?: MouseEventHandler<T>;
  onContextMenu?: MouseEventHandler<T>;
  onDoubleClick?: MouseEventHandler<T>;
  onDrag?: DragEventHandler<T>;
  onDragEnd?: DragEventHandler<T>;
  onDragEnter?: DragEventHandler<T>;
  onDragExit?: DragEventHandler<T>;
  onDragLeave?: DragEventHandler<T>;
  onDragOver?: DragEventHandler<T>;
  onDragStart?: DragEventHandler<T>;
  onDrop?: DragEventHandler<T>;
  onMouseDown?: MouseEventHandler<T>;
  onMouseEnter?: MouseEventHandler<T>;
  onMouseLeave?: MouseEventHandler<T>;
  onMouseMove?: MouseEventHandler<T>;
  onMouseOut?: MouseEventHandler<T>;
  onMouseOver?: MouseEventHandler<T>;
  onMouseUp?: MouseEventHandler<T>;

  onPointerDown?: PointerEventHandler<T>;
  onPointerMove?: PointerEventHandler<T>;
  onPointerUp?: PointerEventHandler<T>;
  onPointerCancel?: PointerEventHandler<T>;
  onPointerEnter?: PointerEventHandler<T>;
  onPointerLeave?: PointerEventHandler<T>;
  onPointerOver?: PointerEventHandler<T>;
  onPointerOut?: PointerEventHandler<T>;

  onSelect?: UIEventHandler<T>;

  onTouchCancel?: TouchEventHandler<T>;
  onTouchEnd?: TouchEventHandler<T>;
  onTouchMove?: TouchEventHandler<T>;
  onTouchStart?: TouchEventHandler<T>;

  onScroll?: UIEventHandler<T>;

  onWheel?: WheelEventHandler<T>;

  onAnimationStart?: AnimationEventHandler<T>;
  onAnimationEnd?: AnimationEventHandler<T>;
  onAnimationIteration?: AnimationEventHandler<T>;

  onTransitionEnd?: TransitionEventHandler<T>;
}

export interface HTMLAttributes<T = Element> extends AriaAttributes, DOMAttributes<T> {
  defaultChecked?: boolean;
  defaultValue?: string | number | readonly string[];
  suppressContentEditableWarning?: boolean;
  suppressHydrationWarning?: boolean;

  className?: string;
  id?: string;
  role?: string;
  style?: CSSProperties;
  tabIndex?: number;
  title?: string;
  draggable?: boolean;
}

export interface ButtonHTMLAttributes<T = Element> extends HTMLAttributes<T> {
  autoFocus?: boolean;
  disabled?: boolean;
  form?: string;
  formAction?: string;
  formEncType?: string;
  formMethod?: string;
  formNoValidate?: boolean;
  formTarget?: string;
  name?: string;
  type?: 'submit' | 'reset' | 'button';
  value?: string | ReadonlyArray<string> | number;
}

export interface InputHTMLAttributes<T = Element> extends HTMLAttributes<T> {
  accept?: string;
  alt?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  capture?: boolean | string;
  checked?: boolean;
  crossOrigin?: string;
  disabled?: boolean;
  form?: string;
  list?: string;
  max?: string | number;
  maxLength?: number;
  min?: string | number;
  minLength?: number;
  multiple?: boolean;
  name?: string;
  pattern?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  size?: number;
  src?: string;
  step?: string | number;
  type?: string;
  value?: string | ReadonlyArray<string> | number;
}

export interface DetailedHTMLProps<E, T> extends E {
  ref?: Ref<T>;
  key?: Key | null;
}

export interface HTMLButtonElement extends HTMLElement {}
export interface HTMLDivElement extends HTMLElement {}
export interface HTMLSpanElement extends HTMLElement {}
export interface HTMLInputElement extends HTMLElement {
  value: string;
}

export interface AbstractView {
  styleMedia: StyleMedia;
  document: Document;
}

export interface StyleMedia {
  type: string;
  matchMedium(mediaquery: string): boolean;
}

export const Fragment: FC<{ children?: ReactNode }>;

export interface CSSProperties {
  [key: string]: string | number | undefined;
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
    children: {};
  }
  interface IntrinsicAttributes {
    key?: Key | null;
  }
  interface IntrinsicClassAttributes<T> extends Attributes {
    ref?: Ref<T>;
  }
  interface IntrinsicElements {
    [elemName: string]: DetailedHTMLProps<HTMLAttributes<any>, any>;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: DetailedHTMLProps<HTMLAttributes<any>, any>;
    }
  }
}
