import { useState } from "react";
import "./index.css";

const Pagination = () => {
  const [totalItems] = useState(1000);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // action = next, previous. number
  const onPageChange = ({ action, pageNumber = 1 }) => {
    if (action === "next") {
      setCurrentPage(() => currentPage + 1);
    } else if (action === "previous") {
      setCurrentPage(() => currentPage - 1);
    } else {
      setCurrentPage(() => pageNumber);
    }
  };

  return (
    <>
      <div className="container">
        <h2>Current Page: {currentPage}</h2>
        <h2>Page Size: {pageSize}</h2>

        <div className="pagination-footer">
          <div>
            Showing {pageSize * currentPage - pageSize} to{" "}
            {pageSize * currentPage} of {totalItems}
          </div>

          <div className="pagination-actions">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange({ action: "previous" })}
            >
              Previous
            </button>
            <p onClick={() => onPageChange({ pageNumber: 1 })}>1</p>
            <p onClick={() => onPageChange({ pageNumber: 2 })}>2</p>
            <p>...</p>
            <p onClick={() => onPageChange({ pageNumber: 100 })}>100</p>
            <button
              disabled={currentPage >= Math.ceil(totalItems / pageSize)}
              onClick={() => onPageChange({ action: "next" })}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pagination;
