import React from "react";
import "./Toolbar.css";

const Toolbar = props => {
  var { file } = props;
  console.log(file);
  return (
    <div className="toolbar">
      <div className="info">{file.name}</div>
      <div className="pages">Page 0 of {file.pages}</div>
      <div className="actions" />
    </div>
  );
};

export default Toolbar;
