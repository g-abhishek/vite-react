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
import ContextAPI from "./components/ContextAPI";
import UseReducerComponent from "./components/UseReducerComponent";
import ContextReducer from "./components/ContextReducer";
import HOC from "./components/HOC";
import CustomHook from "./components/CustomHook";
import DebounceSearch from "./components/DebounceSearch";
import ErrorBoundaryComponent from "./components/ErrorBoundaryComponent";
import EventBubling from "./components/EventBubling";
import MediaQuery from "./components/MediaQuery";
import CSSBoxModel from "./components/CSSBoxModel";
import SuspenseComponent from "./components/SuspenseComponent";
import WebWorker from "./components/WebWorker";

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
          <Link to={"/use-reducer"}>UseReducer</Link>
          <Link to={"/context-api"}>Context API</Link>
          <Link to={"/context-reducer"}>Context + Reducer</Link>
          <Link to={"/hoc"}>HOC</Link>
          <Link to={"/custom-hook"}>CustomHook</Link>
          <Link to={"/debounce-search"}>DebounceSearch</Link>
          <Link to={"/error-boundary"}>ErrorBoundary</Link>
          <Link to={"/event-bubling"}>EventBubling</Link>
          <Link to={"/media-query"}>MediaQuery</Link>
          <Link to={"/css-box-model"}>CSSBoxModel</Link>
          <Link to={"/suspense-component"}>SuspenseComponent</Link>
          <Link to={"/web-worker"}>WebWorker</Link>

          <div>Interview</div>
          <Link to={"/closure-interval"}>ClosureInterval</Link>
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/web-worker" element={<WebWorker />} />
            <Route path="/suspense-component" element={<SuspenseComponent />} />
            <Route path="/css-box-model" element={<CSSBoxModel />} />
            <Route path="/media-query" element={<MediaQuery />} />
            <Route path="/event-bubling" element={<EventBubling />} />
            <Route
              path="/error-boundary"
              element={<ErrorBoundaryComponent />}
            />
            <Route path="/debounce-search" element={<DebounceSearch />} />
            <Route path="/custom-hook" element={<CustomHook />} />
            <Route path="/hoc" element={<HOC />} />
            <Route path="/context-reducer" element={<ContextReducer />} />
            <Route path="/context-api" element={<ContextAPI />} />
            <Route path="/use-reducer" element={<UseReducerComponent />} />
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
