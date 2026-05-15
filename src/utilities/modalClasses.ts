/**
 * Modal overlay positioning classes.
 * In demo mode, modals are scoped to the 550 px remote column so they don't
 * bleed over the demo panel on the right.
 */
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const MODAL_INSET = IS_DEMO
  ? "fixed inset-y-0 left-0 w-[550px]"
  : "fixed inset-0";
