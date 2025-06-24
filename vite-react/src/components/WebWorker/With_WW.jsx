import { useRef } from "react";
import { useEffect } from "react";

const With_WW = () => {
  useEffect(() => {
    const worker = new Worker(new URL("./worker.js", import.meta.url));
    worker.postMessage("Start Heavy Task....");

    worker.onmessage = (e) => {
      console.log(e.data);
    };

    return () => worker.terminate();
  }, []);

  return (
    <>
      <div>With_WW</div>
    </>
  );
};

export default With_WW;
