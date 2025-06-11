import "./App.css";
import TicTakToe from "./components/TicTacToe";
import { Link, Route, Routes } from "react-router-dom";
import Counter from "./components/Counter";
import UseCallback from "./components/UseCallback";
import UseMemo from "./components/UseMemo";
import UseLayoutEffect from "./components/UseLayoutEffect";
import Pagination from "./components/Pagination";
import InfiniteScroll from "./components/InfiniteScroll";
import ClosureInterval from "./components/Interview/ClosureInterval";
import LazyloadingImage from "./components/LazyloadingImage";

function App() {
  return (
    <>
      <div className="main-layout">
        <div className="side-bar">
          <Link to={"/"}>Home</Link>
          <Link to={"/tic-tac-toe"}>Tic Tac Toe</Link>
          <Link to={"/use-callback"}>Use Callback Example</Link>
          <Link to={"/use-memo"}>Use Memo Example</Link>
          <Link to={"/use-layout-effect"}>Use Layout Effect Example</Link>
          <Link to={"/pagination"}>Pagination</Link>
          <Link to={"/infinite-scroll"}>InfiniteScroll</Link>
          <Link to={"/lazy-loading-image"}>LazyloadingImage</Link>

          <div>Interview</div>
          <Link to={"/closure-interval"}>ClosureInterval</Link>
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/lazy-loading-image" element={<LazyloadingImage />} />
            <Route path="/closure-interval" element={<ClosureInterval />} />
            <Route path="/infinite-scroll" element={<InfiniteScroll />} />
            <Route path="/pagination" element={<Pagination />} />
            <Route path="/use-layout-effect" element={<UseLayoutEffect />} />
            <Route path="/use-memo" element={<UseMemo />} />
            <Route path="/use-callback" element={<UseCallback />} />
            <Route path="/tic-tac-toe" element={<TicTakToe />} />
            <Route path="/" element={<Counter />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
