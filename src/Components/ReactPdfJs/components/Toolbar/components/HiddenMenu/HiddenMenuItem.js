import React from "react";

const HiddenMenuItem = props => {
  return <li className="hidden-menu__item">{props.children}</li>;
};

export default HiddenMenuItem;
