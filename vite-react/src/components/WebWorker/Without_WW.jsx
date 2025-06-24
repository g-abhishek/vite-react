import { useEffect } from "react";

const Without_WW = () => {
  useEffect(() => {
    console.log("Without_WW Heavy taks started");
    for (let i = 0; i < 10000000000; i++) {}
    console.log("Without_WW Heavy taks completed");
  }, []);

  return (
    <>
      <div>Without_WW</div>
    </>
  );
};

export default Without_WW;
