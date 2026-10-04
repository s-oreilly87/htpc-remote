import React, { useCallback, useEffect, useRef } from "react";

interface Props {
  enabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onSwipe: (direction: "left" | "right") => void;
}

const SwipeDetector: React.FC<Props> = ({
  children,
  onSwipe,
  enabled = true,
  className,
}) => {
  const childRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    startXRef.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (startXRef.current !== null) {
        const endX = event.changedTouches[0]?.clientX ?? 0;
        const distance = endX - startXRef.current;
        if (Math.abs(distance) > 75) {
          onSwipe(distance > 0 ? "right" : "left");
        }
        startXRef.current = null;
      }
    },
    [onSwipe],
  );

  useEffect(() => {
    startXRef.current = null;
    if (!enabled) return;
    const currentChild = childRef.current;
    if (currentChild) {
      currentChild.addEventListener("touchstart", handleTouchStart);
      currentChild.addEventListener("touchend", handleTouchEnd);

      return () => {
        currentChild.removeEventListener("touchstart", handleTouchStart);
        currentChild.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [enabled, handleTouchEnd, handleTouchStart]);

  return (
    <div ref={childRef} className={className}>
      {children}
    </div>
  );
};

export default SwipeDetector;
