const EventBubling = () => {
  const onParentClick = () => {
    console.log("Parent clicked");
  };
  const handleChildClick = (e) => {
    e.stopPropagation();
    console.log("Child clicked");
  };

  return (
    <>
      <div onClick={onParentClick}>
        <button onClick={handleChildClick}>Click Me</button>
      </div>
    </>
  );
};

export default EventBubling;

/**
 * 🧠 What is Event Bubbling? (in plain JavaScript)
 * Event bubbling is a concept in the browser’s event system where an event triggered on a child element propagates upward to its parent, then grandparent, and so on.
 * 
 *  
    <div id="parent">
        <button id="child">Click Me</button>
    </div>

    <script>
        document.getElementById("parent").addEventListener("click", () => {
            console.log("Parent clicked");
        });

        document.getElementById("child").addEventListener("click", () => {
            console.log("Child clicked");
        });
    </script>

 * > Child clicked
 * > Parent clicked
 * 
 * This is because:
 * The click event first runs on the button.
 * Then, it bubbles up and also triggers the listener on the div.
 * 
 * 
 * 🔁 How does this apply to React?
 * React uses a synthetic event system (a wrapper around native DOM events). But event bubbling still behaves the same.
 * 
 * 🧠 What Is a "Synthetic Event" in React?
 * React uses a system called Synthetic Events — these are custom wrapper objects around the browser’s native events (like click, change, keydown, etc.).
 * 
 * 🔹 Why does React do this?
 *  1. To provide a consistent API across all browsers
 *  2. o allow performance optimizations (like event pooling, batching)
 * 
 * ✅ So What Does This Sentence Mean?
 * "React uses a synthetic event system (a wrapper around native DOM events). But event bubbling still behaves the same."
 * 
 * It means:
 * React doesn’t stop the browser’s normal bubbling behavior
 * Even though you're working with a SyntheticEvent, bubbling still happens
 * 
 * 🛑 How to Stop Bubbling?
 * You can use event.stopPropagation() to stop the event from bubbling up.
 */
