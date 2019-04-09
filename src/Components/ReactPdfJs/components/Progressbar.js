import React from "react";

const Progressbar = props => {
  const { loading } = props;
  const style = {
    width: loading + "%"
  };
  return (
    <div className="progressbar">
      {loading < 100 ? (
        <span className="progressbar__bar" style={style} />
      ) : null}
      {loading < 100 ? (
        <span className="progressbar__text">{loading}% loaded</span>
      ) : null}
    </div>
  );
};

export default Progressbar;
