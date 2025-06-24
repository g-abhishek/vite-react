import "./index.css";
import { TABLE_DATA } from "./constant";
import Pagination from "../Pagination";
import { useEffect, useState } from "react";
const Table = () => {
  const [pageSize] = useState(10);
  const [data, setData] = useState([]);

  const onPageChange = (currentPage) => {
    console.log(currentPage);
    const data = TABLE_DATA.data.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );

    setData(data);
  };

  useEffect(() => {
    onPageChange(1);
  }, []);

  return (
    <>
      <div>Table</div>
      <table>
        <thead>
          <tr>
            {Object.values(TABLE_DATA.columns).map((col, index) => (
              <th key={col + index}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr>
              {Object.keys(TABLE_DATA.columns).map((col) => (
                <td>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={Object.values(TABLE_DATA.columns).length}>
              <Pagination
                total_items={TABLE_DATA.data.length}
                page_size={pageSize}
                onPageChange={onPageChange}
              />
            </td>
          </tr>
        </tfoot>
      </table>
    </>
  );
};

export default Table;
