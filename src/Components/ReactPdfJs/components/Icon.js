import React from "react";

const Icon = props => {
  return (
    <span onClick={props.action} className="toolbar__icon">
      {props.children}
    </span>
  );
};

export default Icon;
