import { useEffect, useRef, useState } from "react";

const LazyImage = ({ src = "", alt = "" }) => {
  const imgRef = useRef();
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entries]) => {
        if (entries.isIntersecting) {
          console.log("entries >>>>>", entries);
          setVisible(true);
          observer.disconnect(); // Stop observing after it becomes visible
        }
      },
      {
        threshold: 0.5,
      }
    );

    observer.observe(imgRef.current);

    // ✅ CLEANUP: Disconnect observer when component unmounts
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div style={{ minWidth: "200px", minHeight: "600px", maxWidth: "80%" }} ref={imgRef}>
      {isVisible && <img src={src} alt={alt} style={{ width: "100%" }} />}
    </div>
  );
};

export default LazyImage;

/**
 * 

The ref is there because IntersectionObserver needs a real DOM node to watch.

imgRef is attached to the wrapper <div>, not the <img>. That matters because:
  1. Something must exist in the DOM from the first render — the <img> only appears after isVisible becomes true, so you can’t observe the image itself upfront.
  2. The placeholder div is what scrolls into view — its minHeight: 600px reserves space, and when that div enters the viewport, you know it’s time to load the image.

Why ref instead of state?
  Approach - State (useState)
  Problem - Updating it triggers a re-render — unnecessary just to store a DOM node

  Approach - Ref (useRef)
  Problem - Holds the DOM element across renders without re-rendering when it’s set

You only need “give me this element once after mount” — that’s exactly what refs are for.

How it connects to the observer - 
      observer.observe(imgRef.current);

After mount, imgRef.current is the actual <div> in the browser. 
The observer watches that element and fires when it intersects the viewport (threshold: 0.5 = 50% visible).
Flow -
Component mounts
      │
      ▼
ref attaches to <div>  →  imgRef.current = DOM node
      │
      ▼
useEffect runs  →  observer.observe(imgRef.current)
      │
      ▼
User scrolls, div enters viewport
      │
      ▼
setVisible(true)  →  <img> renders and loads src









 * 
 * 
 */
