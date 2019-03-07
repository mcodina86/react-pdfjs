import React from "react";
import PDF from "pdfjs-dist";

export default class ReactPdfJs extends React.Component {
  state = {
    pdf: {},
    testPdf: "files/quiroga.pdf",
    workerSrc:
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.943/pdf.worker.js"
  };

  componentDidMount() {
    // Load the file
    // console.log(PDF);
    // console.log(this.state.testPdf);
    PDF.GlobalWorkerOptions.workerSrc = this.state.workerSrc;

    var loading = PDF.getDocument({
      url: this.state.testPdf
    });
    console.log(loading);
  }

  render() {
    return <div>PDF.JS</div>;
  }
}
