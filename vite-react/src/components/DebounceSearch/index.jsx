import { useState } from "react";
import { debounce } from "../../utils";

const DebounceSearch = () => {
  const [search, setSearch] = useState("");
  const debouncedFn = debounce((text) => {
    setSearch(text);
  }, 300);

  return (
    <>
      <div>DebounceSearch</div>
      <div>
        <input
          type="text"
          onChange={(e) => {
            debouncedFn(e.target.value);
          }}
        />
        <p>Search Text: {search}</p>
      </div>
    </>
  );
};

export default DebounceSearch;
