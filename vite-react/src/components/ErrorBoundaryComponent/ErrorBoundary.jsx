import React from "react";
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  // ✅ Set fallback UI
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught in ErrorBoundary:", error, errorInfo); // Log it
    // sendToMonitoringTool(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong 😢</h2>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * 🧠 What is an Error Boundary?
 * An Error Boundary is a special type of React component that catches JavaScript errors anywhere in its child component tree, logs those errors, and shows a fallback UI instead of crashing the entire app.
 * 
 * It works like a try/catch — but specifically for render-time errors in React components.
 * 
 * NOTE:- ❌ No. As of now, Error Boundaries must be class components — React doesn't support them as hooks.
 */

/**
 * Diff between getDerivedStateFromError and componentDidCatch
 * 
 * 1. static getDerivedStateFromError(error) - Used to update the component’s state when an error is thrown during rendering.
 * 📌 Key points:
 * 1. It’s a static method.
 * 2. It must return an object to update state.
 * 3. It’s called during render phase (before the component is re-rendered with fallback UI).
 * ❗It does NOT give you error details like stack trace.
 * 
 * 2. componentDidCatch(error, errorInfo) - Used to log error details (e.g., to a logging service or console).
 * 📌 Key points:
 * 1. It’s called after render, in the commit phase.
 * 2. You get two arguments:
 *      1. error: the actual error object
 *      2. errorInfo: contains the component stack trace
 */

/**
 * ❌ No, Error Boundary will not catch event error
 * Because:
 * Error Boundaries only catch errors during:
 *  1. rendering
 *  2. lifecycle methods
 *  3. constructors of class components
 * 
 * But if error thown inside any function or like in any event - <button onClick={raiseError}>Throw Error</button>
 * Errors in event handlers are not catchable by error boundaries.
 * 
 * ✅ Why?
 * React doesn’t bubble event handler errors to the rendering process — it lets them propagate to the console like regular JS. So:
 *  1. If an error happens in render() → Error boundary can catch ✅
 *  2. If an error happens in onClick → You must handle it manually ❌
 */
