import React from "react";

const Page = props => {
  const { loaded, number } = props;
  return (
    <div className={`page page-${number}`}>
      {loaded ? <canvas className={`canvas-page-${number}`} /> : null}
    </div>
  );
};

export default Page;
