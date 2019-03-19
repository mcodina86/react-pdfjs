import React from "react";
import "./Toolbar.css";

const Toolbar = props => {
  var { file, currentPage } = props;
  return (
    <div className="toolbar">
      <div className="info">{file.name}</div>
      <div className="pages">
        Page {currentPage} of {file.pages}
      </div>
      <div className="actions" />
    </div>
  );
};

export default Toolbar;
