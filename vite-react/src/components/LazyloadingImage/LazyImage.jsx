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
  }, []);

  return (
    <div style={{ minWidth: "200px", minHeight: "600px", maxWidth: "80%" }} ref={imgRef}>
      {isVisible && <img src={src} alt={alt} style={{ width: "100%" }} />}
    </div>
  );
};

export default LazyImage;
