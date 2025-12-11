import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import "./index.css";

const InfiniteScroll = () => {
  const skipRef = useRef(0);
  const loading = useRef(false);
  const [posts, setPosts] = useState([]);
  // const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async ({ skip = 0, limit = 20 }) => {
    // if (loading) return false;

    // setLoading(true);
    const res = await axios.get(
      `https://dummyjson.com/products?limit=${limit}&skip=${skip}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const { products } = res.data;
    setPosts((posts) => [...posts, ...products]);
    skipRef.current = skipRef.current + limit;

    // setLoading(false);
  }, []);

  useEffect(() => {
    console.log("useEffect 1===========");
    fetchPosts({ skip: skipRef.current });
  }, []);

  useEffect(() => {
    const handleScroll = async () => {
      if (loading.current) return false;

      const screenHeight = window.innerHeight;
      const tillScrolled = window.scrollY;
      const totalScrollingHeight = document.body.scrollHeight;

      const nearBottom =
        screenHeight + tillScrolled > totalScrollingHeight - 500;
      if (nearBottom && !loading.current) {
        loading.current = true;
        await fetchPosts({ skip: skipRef.current });
        loading.current = false;
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [fetchPosts]);
  /**
   * React's useEffect has a simple contract:
   *  | “Declare all variables and functions used inside the effect in the dependency array.”
   */

  return (
    <>
      <div className="container">
        {posts?.map((post) => (
          <div key={post.id} className="card">
            <div className="card-image">
              <div className="image-container">{post?.id}</div>
            </div>
            <div className="card-body">
              <p className="card-title">{post.title}</p>
              <div className="card-descriptions-1">
                <p>
                  Brand: <span>{post.brand}</span>
                </p>
                <p>
                  Category: <span>{post.category}</span>
                </p>
                <p>
                  SKU: <span>{post.sku}</span>
                </p>
              </div>
            </div>
            <div className="card-action"></div>
          </div>
        ))}
      </div>
    </>
  );
};

export default InfiniteScroll;

/**
 * ============================================================================
 * WHY useRef INSTEAD OF useState FOR `loading` AND `skipRef`?
 * ============================================================================
 *
 * PROBLEM 1: STALE CLOSURE
 * -------------------------
 * Event handlers capture state values at creation time (closure).
 * With useState, the handler always sees the initial value.
 *
 * BROKEN CODE WITH useState:
 * --------------------------
 * const [loading, setLoading] = useState(false);
 *
 * useEffect(() => {
 *   const handleScroll = async () => {
 *     if (loading) return;  // ⚠️ `loading` is captured as `false` forever!
 *
 *     if (nearBottom && !loading) {
 *       setLoading(true);           // Updates state, triggers re-render
 *       await fetchPosts();         // But old handler still has loading=false
 *       setLoading(false);
 *     }
 *   };
 *   window.addEventListener("scroll", handleScroll);
 *   return () => window.removeEventListener("scroll", handleScroll);
 * }, []);  // Empty deps = handler created once with loading=false
 *
 * TIMELINE (BROKEN):
 *   Scroll Event 1: loading=false (closure) → FETCH → setLoading(true)
 *   Scroll Event 2: loading=false (STALE!)  → FETCH AGAIN! 💥
 *   Scroll Event 3: loading=false (STALE!)  → FETCH AGAIN! 💥
 *   Result: Multiple duplicate API calls!
 *
 * ============================================================================
 *
 * PROBLEM 2: ADDING `loading` TO DEPENDENCY ARRAY (ATTEMPTED FIX)
 * ----------------------------------------------------------------
 * You might think: "Let's add `loading` to the dependency array!"
 *
 * ATTEMPTED FIX:
 * --------------
 * const [loading, setLoading] = useState(false);
 *
 * useEffect(() => {
 *   const handleScroll = async () => {
 *     if (loading) return;  // Now `loading` is in deps, should work?
 *
 *     if (nearBottom && !loading) {
 *       setLoading(true);
 *       await fetchPosts();
 *       setLoading(false);
 *     }
 *   };
 *   window.addEventListener("scroll", handleScroll);
 *   return () => window.removeEventListener("scroll", handleScroll);
 * }, [loading]);  // ⚠️ Now depends on `loading`
 *
 * WHAT HAPPENS:
 *   1. Component mounts → loading=false → effect runs → listener added
 *   2. User scrolls → fetch starts → setLoading(true)
 *   3. Re-render → loading=true → effect CLEANUP runs → listener REMOVED
 *   4. Effect runs again → NEW listener added with loading=true
 *   5. Fetch completes → setLoading(false)
 *   6. Re-render → loading=false → effect CLEANUP runs → listener REMOVED
 *   7. Effect runs again → NEW listener added with loading=false
 *
 * TIMELINE (INEFFICIENT):
 *   setLoading(true)  → remove listener → add new listener
 *   setLoading(false) → remove listener → add new listener
 *   (This happens TWICE per fetch cycle!)
 *
 * PROBLEMS:
 *   - Unnecessary overhead: Adding/removing listeners on every state change
 *   - Potential race conditions during cleanup
 *   - Still won't work reliably for rapid scroll events
 *   - More complex and harder to reason about
 *
 * ============================================================================
 *
 * WORKING CODE WITH useRef:
 * -------------------------
 * const loading = useRef(false);
 *
 * useEffect(() => {
 *   const handleScroll = async () => {
 *     if (loading.current) return;  // ✅ Always reads latest value
 *
 *     if (nearBottom && !loading.current) {
 *       loading.current = true;      // Instant sync update
 *       await fetchPosts();
 *       loading.current = false;
 *     }
 *   };
 *   window.addEventListener("scroll", handleScroll);
 *   return () => window.removeEventListener("scroll", handleScroll);
 * }, []);
 *
 * TIMELINE (WORKING):
 *   Scroll Event 1: loading.current=false → FETCH → loading.current=true
 *   Scroll Event 2: loading.current=true  → BLOCKED ✅
 *   Scroll Event 3: loading.current=true  → BLOCKED ✅
 *   Fetch completes: loading.current=false
 *   Scroll Event 4: loading.current=false → FETCH ✅
 *
 * WHY useRef WORKS:
 * -----------------
 * 1. IMMEDIATE VALUE ACCESS:
 *    - useRef.current gives you the latest value immediately
 *    - With useState, you'd get a stale closure value inside the scroll handler
 *
 * 2. NO RE-RENDER NEEDED:
 *    - We only use `loading` as a guard to prevent multiple API calls
 *    - We don't need to show a loading spinner or update the UI based on it
 *    - No point triggering re-renders for internal flags
 *
 * 3. SYNCHRONOUS UPDATES:
 *    - ref.current = true updates instantly (synchronous)
 *    - With setState, the update is asynchronous (batched)
 *    - Rapid scroll events could trigger multiple fetches before state updates
 *
 * ============================================================================
 *
 * KEY DIFFERENCES:
 * ----------------
 * | Aspect              | useState          | useRef              |
 * |---------------------|-------------------|---------------------|
 * | Update timing       | Async (batched)   | Sync (immediate)    |
 * | Triggers re-render  | Yes               | No                  |
 * | Value in closures   | Stale (captured)  | Always current      |
 * | Use case            | UI display        | Internal flags      |
 *
 * ============================================================================
 */
