/**
 * Modal overlay positioning classes.
 * In demo mode, desktop modals are scoped to the 550 px remote column so they
 * don't bleed over the demo panel on the right. Below the lg breakpoint the
 * demo panel is hidden, so modals should cover the full viewport.
 */
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const MODAL_INSET = IS_DEMO
  ? "fixed inset-0 lg:inset-y-0 lg:left-0 lg:right-auto lg:w-[550px]"
  : "fixed inset-0";
