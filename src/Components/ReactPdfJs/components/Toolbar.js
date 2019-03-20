import React from "react";
import "./Toolbar.css";

const Toolbar = props => {
  var { file, currentPage, goToPage } = props;
  return (
    <div className="toolbar">
      <div className="info">{file.name}</div>
      <div className="pages">
        <span className="page-link is-previous">
          <button onClick={() => goToPage(true)}>&lsaquo; Prev</button>
        </span>
        {currentPage} of {file.pages}
        <span className="page-link is-next">
          <button onClick={() => goToPage()}>Next &rsaquo;</button>
        </span>
      </div>
      <div className="actions" />
    </div>
  );
};

export default Toolbar;
