import { useEffect, useState } from "react";

const ClosureInterval = () => {
  const [count, setCount] = useState(0);
  console.log("Component rendering.......");

  useEffect(() => {
    console.log("Use Effect Running...");

    const interval = setInterval(() => {
      console.log("Interval log:", count);
      setCount(count + 1);
    }, 1000);

    return () => {
      console.log("Interval cleared");
      clearInterval(interval);
    };
  }, [cunt]); // add "count" here to fix the closure issue

  return (
    <div>
      <div>Interview: {count}</div>

      <p>
        We have used setInterval inside a useEffect that has an empty dependency
        array, so it runs only once on mount.
      </p>
      <p>
        But inside that interval callback, we are referencing the count from the
        first render due to closure. Means count will be zero all the time
      </p>

      <br />
      <div>
        🧠 The Closure Problem Here
        <ul>
          <li>
            The function passed to setInterval closes over the initial value of
            count, which is 0.
          </li>
          <li>So setCount(count + 1) always becomes setCount(1).</li>
          <li>Every time the interval runs, it sets the count to 1 again.</li>
          <li>Hence the value never increments past 1.</li>
        </ul>
      </div>
      <br />
      <br />

      <div>✅ How to Fix It?</div>
      <div>
        ✅ Option 1: Use Functional setState
        <ul>
          <li>
            React gives you access to the latest state inside the setCount
            functional form:
          </li>
          <li>
            <code>setCount(prev => prev + 1);</code>
          </li>
          <li>This avoids stale closure problems.</li>
        </ul>
        🔸 Note: console.log("Interval log:", count) will still show the stale
        value, but the count will increment correctly on screen.
      </div>
      <br />
      <br />
      <div>
        🧭 If You Want to Always Log the Latest Count
        <ul>
          <li>pass count in dependency array</li>
        </ul>
      </div>
    </div>
  );
};

export default ClosureInterval;
