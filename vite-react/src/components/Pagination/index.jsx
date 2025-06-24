import { useEffect, useState } from "react";
import "./index.css";

const getPagination = ({ selectedPage, totalPages }) => {
  let arr = [];

  if (totalPages <= 7) {
    arr = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else if (selectedPage <= 3) {
    arr = [1, 2, 3, 4, "...", totalPages];
  } else if (selectedPage >= totalPages - 2) {
    arr = [
      1,
      "...",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  } else {
    arr = [
      1,
      "...",
      selectedPage - 1,
      selectedPage,
      selectedPage + 1,
      "...",
      totalPages,
    ];
  }

  return arr;
};

const Pagination = ({ total_items = 95, page_size = 10, onPageChange }) => {
  const [totalItems] = useState(total_items);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(page_size);

  useEffect(() => {
    setTotalPages(() => Math.ceil(totalItems / pageSize));
  }, [totalItems, currentPage, pageSize]);

  // action = next, previous. number
  const handleButtonClick = ({ action, pageNumber = 1 }) => {
    if (action === "next") {
      setCurrentPage(() => currentPage + 1);
      onPageChange(currentPage + 1);
    } else if (action === "previous") {
      setCurrentPage(() => currentPage - 1);
      onPageChange(currentPage - 1);
    } else {
      setCurrentPage(() => pageNumber);
      onPageChange(pageNumber);
    }
  };

  return (
    <>
      <div className="container">
        {/* <h2>Current Page: {currentPage}</h2>
        <h2>Page Size: {pageSize}</h2> */}

        <div className="pagination-footer">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(pageSize * currentPage, totalItems)} of {totalItems}
          </div>

          <div className="pagination-actions">
            <button
              disabled={currentPage <= 1}
              onClick={() => handleButtonClick({ action: "previous" })}
            >
              Previous
            </button>

            {getPagination({ selectedPage: currentPage, totalPages }).map(
              (p, i) => (
                <p
                  key={i}
                  className={currentPage === p ? "active" : ""}
                  onClick={() =>
                    typeof p === "number"
                      ? handleButtonClick({ pageNumber: p })
                      : {}
                  }
                >
                  {p}
                </p>
              )
            )}

            <button
              disabled={currentPage >= Math.ceil(totalItems / pageSize)}
              onClick={() => handleButtonClick({ action: "next" })}
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
