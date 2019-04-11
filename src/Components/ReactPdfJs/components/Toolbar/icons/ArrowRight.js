import React from "react";
import SvgBase from "./SvgBase";

const ArrowRight = props => {
  const scale = props.scale || 1;
  const color = props.color || "#ff0000";

  return (
    <SvgBase width="32" height="32" scale={scale}>
      <path
        d="m11.078 0.054386c5.319 5.2539 10.522 10.627 15.867 15.854-5.3594 5.3356-10.701 10.69-16.049 16.038h-4.8421l16.059-16.059-15.838-15.832z"
        fill={color}
      />
    </SvgBase>
  );
};

export default ArrowRight;
