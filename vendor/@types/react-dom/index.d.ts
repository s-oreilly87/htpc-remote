// Minimal stub of @types/react-dom.
import type { ReactElement, ReactNode } from '../react';

export function render(element: ReactElement, container: Element | DocumentFragment | null, callback?: () => void): void;
export function hydrate(element: ReactElement, container: Element | DocumentFragment | null, callback?: () => void): void;
export function createPortal(child: ReactNode, container: Element | DocumentFragment, key?: null | string): ReactElement;
export function unmountComponentAtNode(container: Element | DocumentFragment): boolean;

export const version: string;
