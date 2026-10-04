/**
 * Modal overlay positioning classes.
 * In demo mode, desktop modals cover the available remote area so they
 * don't bleed over the demo panel on the right. Below the lg breakpoint the
 * demo panel is hidden, so modals should cover the full viewport.
 */
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const MODAL_INSET = IS_DEMO
  ? "fixed inset-0 lg:right-[480px]"
  : "fixed inset-0";
