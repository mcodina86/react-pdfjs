import React from "react";

const SvgBase = props => {
  const { width, height, scale } = props;
  const viewport = props.viewport || `0 0 ${width} ${height}`;
  return (
    <svg
      width={width}
      height={height}
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewport={viewport}
      style={{
        verticalAlign: "middle",
        transform: `scale(${scale})`
      }}
    >
      {props.children}
    </svg>
  );
};

export default SvgBase;
