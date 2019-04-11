import React from "react";
import SvgBase from "./SvgBase";

const RotateCW = props => {
  const scale = props.scale || 1;
  const color = props.color || "#ff0000";

  return (
    <SvgBase width="32" height="32" scale={scale}>
      <g transform="matrix(3.7104 0 0 3.7104 -.19789 -1070.3)" fill={color}>
        <g transform="matrix(-.078974 0 0 .078974 3.0896 269.97)" fill={color}>
          <path
            d="m-18.667 341.9v-43.03l21.444 21.444zm2.5129-106.42c26.096 0 47.434 21.339 47.434 47.434 0 0.0318-0.0011 0.0633-0.0011 0.0951h-17.197c9.5e-5 -0.0318 0.0011-0.0633 0.0011-0.0951 0-16.802-13.436-30.239-30.239-30.239-16.802 0-30.239 13.436-30.239 30.239 0 16.135 12.392 29.165 28.254 30.173v17.217c-25.185-1.0491-45.452-21.959-45.452-47.392 0-26.096 21.339-47.434 47.434-47.434z"
            fill={color}
          />
        </g>
      </g>
    </SvgBase>
  );
};

export default RotateCW;
