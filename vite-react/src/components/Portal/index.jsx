import React from "react";
import { createPortal } from 'react-dom'

// inspect element and check #modal-root is in bottom of all the elements and "Modal Root is added inside it"
function index() {
  return createPortal(<div className="modal-container">Modal Root</div> , document.getElementById("modal-root"));
}

export default index;

/**
 * ReactDom.createPortal lets you render a React Component outside its parent(root) DOM hierarchy, while still keeping it in the same React tree.
 * This is extremely useful for modals, dropdowns, tooltips, sidebars, or anything that must visually “escape” overflow/positioning constraints of the parent.
 * 
 * 🔎 Why Use Portals?
 * ✔ For modals / dropdowns / tooltips
 *  - They usually need to appear on top of everything else.
 * ✔ Escaping CSS overflow issues
 *  - Parent containers with overflow: hidden, position: relative, etc., won’t trap your UI.
 */
