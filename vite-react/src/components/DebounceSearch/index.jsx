import { useEffect, useState } from "react";
import { debounce } from "../../utils";
import useDebounce from "../../hooks/useDebounce";

const DebounceSearch = () => {
  const [search, setSearch] = useState("");
  const debouncedFn = debounce((text) => {
    setSearch(text);
  }, 300);

  // use debounce hook that will only return debounced value
  const [query, setQuery] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  useEffect(() => {
    if (debouncedQuery) {
      setDebouncedValue(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <>
      <div>DebounceSearch</div>
      <div>
        <p>Utility Function</p>
        <input
          type="text"
          onChange={(e) => {
            debouncedFn(e.target.value);
          }}
        />
        <p>Search Text: {search}</p>
      </div>

      <br />
      <br />
      <div>
        <p>useDebounceHook: this hook will only return debounced value</p>
        <input
          type="text"
          onChange={(e) => {
            setQuery(e.target.value);
          }}
        />
        <p>Search Text: {debouncedValue}</p>
      </div>
    </>
  );
};

export default DebounceSearch;
