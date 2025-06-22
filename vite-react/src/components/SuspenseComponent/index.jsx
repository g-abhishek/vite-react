import { lazy, Suspense } from "react";
// import Profile from "./Profile";
const ProfileLazy = lazy(() => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(import("./Profile")), 2000);
  });
});

const SuspenseComponent = () => {
  return (
    <>
      <h1>SuspenseComponent</h1>
      <br />
      <br />

      <Suspense fallback={<div style={{ color: "red" }}>Loading......</div>}>
        <ProfileLazy />
      </Suspense>
    </>
  );
};

export default SuspenseComponent;

/**
 * 🧠 What is Suspense?
 * React Suspense lets your components "wait" for something before they render — usually data, code (lazy-loaded), or other resources.
 * Think of it like a loading boundary.
 * While a component is waiting for something (like an API or lazy-loaded code), Suspense lets you show a fallback UI (like a spinner or message) until it's ready.
 * 
 * While ProfileLazy is loading (JS chunk download), it shows "Loading..."
 * Once ready, ProfileLazy renders.
 * 
 * 🔍 Why is Suspense Useful?
 * 1. Code Splitting: Load parts of your app only when needed.
 * 2. Data Fetching: With libraries like React Query, Relay, or React Server Components, Suspense can wait for data before rendering.
 * 3. Better UX: Avoid "jumpy" UIs by controlling when things show up.
 * 
 * ⏳ Limitations of Suspense (for now)
 * 1. Suspense only works for lazy-loaded components and concurrent-compatible libraries.
 * 2. You can’t yet use Suspense directly for async data fetching without external tools (React 19 is improving this).
 * 3. React 19 introduces use() hook for truly Suspense-powered async rendering.
 * 
 * 
 */
