import React from "react";
import ReactPdfJs from "./Components/ReactPdfJs";

const App = () => {
  const content = (
    <div className="App">
      <ReactPdfJs scale="1" debug="true" />
    </div>
  );

  return content;
};

export default App;
