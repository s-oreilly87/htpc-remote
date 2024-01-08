import {useEffect, useRef} from "react";

const SwipeDetector = ({ children, onSwipe }) => {
  const childRef = useRef(null);
  const startXRef = useRef(null);

  function handleTouchStart(event) {
    startXRef.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (startXRef.current !== null) {
      const endX = event.changedTouches[0].clientX;
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
