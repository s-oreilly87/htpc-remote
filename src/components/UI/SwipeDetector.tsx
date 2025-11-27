import React, { useEffect, useRef } from "react";

interface SwipeDetectorProps {
  children: React.ReactNode;
  onSwipe: (direction: "left" | "right") => void;
}

const SwipeDetector: React.FC<SwipeDetectorProps> = ({ children, onSwipe }) => {
  const childRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);

  function handleTouchStart(event: TouchEvent) {
    startXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent) {
    if (startXRef.current !== null) {
      const endX = event.changedTouches[0]?.clientX ?? 0;
      const distance = endX - startXRef.current;
      if (Math.abs(distance) > 75) {
        onSwipe(distance > 0 ? "right" : "left");
      }
      startXRef.current = null;
    }
  }

  useEffect(() => {
    const currentChild = childRef.current;
    if (currentChild) {
      currentChild.addEventListener("touchstart", handleTouchStart);
      currentChild.addEventListener("touchend", handleTouchEnd);

      return () => {
        currentChild.removeEventListener("touchstart", handleTouchStart);
        currentChild.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, []);

  return <div ref={childRef}>{children}</div>;
};

export default SwipeDetector;
