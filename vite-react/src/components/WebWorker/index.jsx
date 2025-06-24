import { useEffect, useRef, useState } from "react";
import With_WW from "./With_WW";
import Without_WW from "./Without_WW";

const WebWorker = () => {
  const [worker, setWorker] = useState(null);

  return (
    <>
      <div>
        <button onClick={() => setWorker(true)}>With WebWorker</button>
        <button onClick={() => setWorker(false)}>Without WebWorker</button>
      </div>
      <br />
      <br />
      <br />

      {worker === true && <With_WW />}
      {worker === false && <Without_WW />}
    </>
  );
};

export default WebWorker;

/**
 * 🧠 What is a Web Worker?
 * A Web Worker is a way to run JavaScript code in the background thread—separate from the main UI thread.
 * 
 * 🚫 Without Web Worker - Heavy computation blocks the UI
 * ✅ With Web Worker - Heavy tasks run in the background, keeping UI responsive.
 * 
 * 🧱 Why Use Web Workers?
 * 1. ✅ Prevent UI freezing
 * 2. ✅ Handle CPU-heavy tasks (image processing, parsing, calculations)
 * 3. ✅ Enable concurrency in JS
 * 
 * 📌 How it works?
 * 1. main thread creates a new Worker
 * 2. Sends data using postMessage
 * 3. Worker runs task and responds via postMessage
 * 4. Main thread listens on onmessage
 * 
 * ⚠️ Things to Remember
 * 1. Web Workers cannot access DOM
 * 2. Can use fetch, XMLHttpRequest, timers, etc.
 * 3. Need to be in separate file
 * 4. Communication is via postMessage and onmessage
 */
