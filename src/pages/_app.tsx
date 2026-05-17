import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { roboto } from "@/styles/fonts";
import "@/styles/globals.css";

// Headless UI v2 calls releasePointerCapture in cleanup without checking
// whether the pointer is still captured, causing a NotFoundError in the
// console. Swallow that specific error; re-throw everything else.
if (typeof window !== "undefined") {
  const _release = Element.prototype.releasePointerCapture;
  Element.prototype.releasePointerCapture = function (pointerId: number) {
    try {
      _release.call(this, pointerId);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "NotFoundError")) throw e;
    }
  };
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <main className={roboto.className}>
        <Component {...pageProps} />
      </main>
    </QueryClientProvider>
  );
}
