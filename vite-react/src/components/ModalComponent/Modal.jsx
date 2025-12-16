import React from "react";
import "./Modal.css";
import ReactDOM from "react-dom";

const modalRoot = document.getElementById("modal-root");
export default function Modal(props) {
  const { title, children, isOpen, onClose } = props;

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose} // click outside to close
    >
      <div
        className="modal-content"
        onClick={(e) => {
          // prevent close when clicking inside
          e.stopPropagation();
        }}
      >
        <h2 className="modal-title">{title}</h2>

        <div>{children}</div>

        <button onClick={onClose}>Close Modal</button>
      </div>
    </div>,
    modalRoot
  );
}
