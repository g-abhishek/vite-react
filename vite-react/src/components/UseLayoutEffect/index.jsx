import { useEffect, useLayoutEffect, useRef, useState } from "react";
// not fully completed
const UseLayoutEffect = () => {
  const [width, setWidth] = useState(0);
  const boxRef = useRef(null);

    // useEffect(() => {
    //   const boxWidth = boxRef.current.getBoundingClientRect().width;
    //   // setting width triggers re-render AFTER paint = flicker!
    //   setWidth(boxWidth);
    // });

  useLayoutEffect(() => {
    const width = boxRef.current.offsetWidth;
    setWidth(width); // sets layout before paint — no flicker
  }, []);
  return (
    <>
      <div style={{ width: "100%" }}>
        <h3>🚫 useEffect (flicker)</h3>
        <div
          ref={boxRef}
          style={{ width: "100%", height: 50, background: "#1bbf24" }}
        >
          Resize me!
        </div>
        <br />

        <div
          style={{
            width,
            height: 50,
            background: "red",
            transition: "all 0.3s ease",
          }}
        ></div>
      </div>
    </>
  );
};

export default UseLayoutEffect;

/**
 * 🧠 Interview Answer (Simple & Effective)
 * useEffect runs after the DOM is painted to the screen.
 * It’s good for side effects like API calls or logging.
 * Cases -
 * Usefull for Side-effects like data fetching, subscriptions
 * It run after paint
 *
 * But useLayoutEffect runs before the browser repaints — useful when you need to measure or mutate the DOM immediately, like synchronizing scroll position or avoiding visual flickers.
 * Usefull for DOM measurements or synchronizing layout
 *
 *
 * ⚠️ Rule of Thumb
 * ✅ Use **useEffect** by default
 * Cases -
 * Use **useLayoutEffect** only when needed (e.g., layout measurement, animations)
 * It runs before paints
 */
