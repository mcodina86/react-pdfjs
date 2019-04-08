import React from "react";
import "./Toolbar.css";

const Toolbar = props => {
  var { name, page, total, goToPage, doZoom } = props;
  return (
    <div className="toolbar">
      <div className="info">{name}</div>
      <div className="pages">
        <span className="page-link is-previous">
          <button onClick={() => goToPage(true)}>&lsaquo; Prev</button>
        </span>
        {page} of {total}
        <span className="page-link is-next">
          <button onClick={() => goToPage()}>Next &rsaquo;</button>
        </span>
      </div>
      <div className="actions">
        <button onClick={() => doZoom()}>Zoom</button>
      </div>
    </div>
  );
};

export default Toolbar;
