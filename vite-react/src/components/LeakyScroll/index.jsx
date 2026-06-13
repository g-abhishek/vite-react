import { useEffect, useState } from "react";

export default function LeakyScroll() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const hugeData = new Array(100000).fill({
        name: "Abhishek",
        age: 25,
      });
    
      const onScroll = () => {
        console.log(hugeData.length);
      };

    window.addEventListener("scroll", onScroll);

    // ❌ No cleanup
    // return () => {
    //     window.removeEventListener("scroll", onScroll);
    // };
  }, [count]);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Re-render ({count})
      </button>

      <div style={{ height: "3000px" }}>
        Scroll me
      </div>
    </div>
  );
}

/**
 * 
 

Take snapshots the right way

Take three snapshots:

Snapshot A: right after load
Snapshot B: after 20 clicks
Snapshot C: after 100 clicks

Then check summary of snapshot:
1. Click on snapshot 1
    1. look for Array/EvenetListener/
    2. look for Retained Size 
    
1. Click on snapshot 2
    1. look for Array/EvenetListener/
    2. look for Retained Size 

Then click on the Retainers tab:
1. Click on the largest retained size
    1. look for Array/EvenetListener/
    2. look for Retained Size 

You will see that the Retained Size is increasing.
This is a sign of a memory leak.

 * 
 */