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
