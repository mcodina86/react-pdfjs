import React from "react";

const Document = React.forwardRef((props, ref) => (
  <div className="pdf" ref={ref}>
    {props.children}
  </div>
));

export default Document;
