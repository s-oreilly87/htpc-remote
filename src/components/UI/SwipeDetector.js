import { useEffect, useRef } from "react";

const SwipeDetector = ({ onSwipe }) => {
  const startXRef = useRef(null);

  function handleTouchStart(event) {
    startXRef.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (startXRef.current !== null) {
      const endX = event.changedTouches[0].clientX;
      const distance = endX - startXRef.current;
      if (Math.abs(distance) > 75) {
        // Only trigger if the distance is more than 75 pixels
        onSwipe(distance > 0 ? "right" : "left");
      }
      startXRef.current = null;
    }
  }

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  });

  return <></>;
};

export default SwipeDetector;
