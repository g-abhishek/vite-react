import React, { createContext, useContext, useState } from "react";
import Modal from "./Modal";

const ModalContext = createContext(null);

function ModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: null,
    conetnt: null,
  });

  const openModal = ({ title = null, content = null }) => {
    setModalState({
      isOpen: true,
      title: title,
      conetnt: content,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      title: null,
      conetnt: null,
    });
  };

  const value = { openModal, closeModal };
  return (
    <ModalContext value={value}>
      {/* this will be parent children, not the mondal content we want */}
      {children}
      
      {/* this is actual modal component where will be opening modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
      >
        {modalState?.conetnt}
      </Modal>
    </ModalContext>
  );
}

export function useModal() {
  return useContext(ModalContext);
}

export default ModalProvider;
