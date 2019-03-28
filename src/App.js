import React, { Component } from "react";
import ReactPdfJs from "./Components/ReactPdfJs";

class App extends Component {
  render() {
    const settings = {
      currentScale: 2,
      debug: true
    };

    return (
      <div className="App">
        <ReactPdfJs settings={settings} />
      </div>
    );
  }
}

export default App;
