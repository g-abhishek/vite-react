import { useState, useMemo } from "react";

function slowFunction(num) {
  console.log("⏳ Running slow function...");
  for (let i = 0; i < 1e9; i++) {} // simulate heavy calculation
  return num * 2;
}

const UseMemo = () => {
  const [number, setNumber] = useState(1);
  const [count, setCount] = useState(0);

  // 🔁 Without useMemo: This runs on EVERY render
  //   const double = slowFunction(number);

  // ✅ With useMemo: Only runs when dependency 'number' changes
  const double = useMemo(() => slowFunction(number), [number]);

  return (
    <div>
      <h2>Double: {double}</h2>

      <input type="number" value={number} onChange={(e) => setNumber(e.target.value)} />
      <button onClick={() => setCount((c) => c + 1)}>
        Re-render ({count})
      </button>
    </div>
  );
};

export default UseMemo;

/**
 * 🧠 Interview Talking Point
 * We use useMemo to optimize performance for expensive computations. Without it, even small re-renders could cause performance bottlenecks by re-running the same logic.
 */

/**
 * 🗣️ How to Explain in Interviews
 * React.memo is for avoiding unnecessary re-renders of components by shallow-comparing props. 
 * useMemo is for avoiding unnecessary recalculations inside components — useful for expensive computations or passing stable object references to children.
 */

// **************************************************

// Please check logs in browser console
/**
 * 🔍 What to Observe
 * When you type a new number → slowFunction runs ✅
 * When you click the "Re-render" button → slowFunction does not run again ✅
 * 
 * If we do not use 'useMemo', on every button click, component rerenders and slowFunction runs again, causing unnecessary performance issues.
 * 
 * 
 * This shows how useMemo saves computation by caching the result unless dependencies ([number]) change.
 */

/**
 * memo vs useMemo
 * 
 * 🧠 memo (for Components)
 * React.memo is used to wrap functional components to avoid re-rendering unless their props change.
 * ✅ When to Use:
 *   1. Component re-renders too often but receives same props
 *   2. Pure functional components
 * 
 * ⚠️ Without memo:
 * Every parent re-render causes child re-render.
 * 
 * Example we can see in UseCallback Component
 * 
 * 
 * 
 * ⚙️ useMemo (for Values)
 * useMemo is a hook used to memoize expensive computations or return stable references.
 * ✅ When to Use:
 *   1. Expensive computations in render
 *   2. You want to avoid recalculating unless dependencies change
 */
