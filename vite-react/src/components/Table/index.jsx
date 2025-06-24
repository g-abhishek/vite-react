import "./index.css";
import { TABLE_DATA } from "./constant";
const Table = () => {
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
          {TABLE_DATA.data.map((row) => (
            <tr>
              {Object.keys(TABLE_DATA.columns).map((col) => (
                <td>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default Table;
