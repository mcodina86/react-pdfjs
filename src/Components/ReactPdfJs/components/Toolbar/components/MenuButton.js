import React from "react";
import "./MenuButton.css";

const MenuButton = props => {
  let { expanded } = props;
  let openedClass = expanded ? "opened" : "";
  return (
    <button
      className={`menu-toggle ${openedClass}`}
      id="menu-toggle"
      aria-expanded={expanded}
      onClick={props.action}
    >
      <span className="screen-reader-text">Menu</span>
      <svg
        className="icon icon-menu-toggle"
        aria-hidden="true"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="0 0 100 100"
      >
        <g className="svg-menu-toggle">
          <path className="line line-1" d="M5 13h90v14H5z" />
          <path className="line line-2" d="M5 43h90v14H5z" />
          <path className="line line-3" d="M5 73h90v14H5z" />
        </g>
      </svg>
    </button>
  );
};

export default MenuButton;
