import React from "react";
import { createPortal } from "react-dom";
import { useModal } from "./ModalContext";

function index() {
  const { openModal } = useModal();
  
  const handleModal = () => {
    openModal({
        title: "Hello from modal...",
        content: () => (<div>Hello Div</div>)
    })
  }
  return (
    <>
      <div>Modal Component Example</div>
      <button onClick={handleModal}>Open Modal</button>
    </>
  );
}

export default index;
