import React from "react";

const Progressbar = props => {
  const { loading } = props;

  return <div>{loading}% loaded</div>;
};

export default Progressbar;
