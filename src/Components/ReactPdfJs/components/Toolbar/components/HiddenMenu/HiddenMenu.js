import React from "react";
import "./HiddenMenu.css";

const HiddenMenu = props => {
  return <ul className="hidden-menu">{props.children}</ul>;
};

export default HiddenMenu;
