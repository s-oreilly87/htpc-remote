import type { ReactElement, ReactNode } from './index';

export const Fragment: (props: { children?: ReactNode }) => ReactElement | null;
export function jsx(type: any, props: any, key?: any): ReactElement;
export function jsxs(type: any, props: any, key?: any): ReactElement;
export function jsxDEV(type: any, props: any, key?: any, isStaticChildren?: boolean, source?: any, self?: any): ReactElement;
