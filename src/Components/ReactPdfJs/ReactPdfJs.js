import React from "react";
import PDF from "pdfjs-dist";

export default class ReactPdfJs extends React.Component {
  state = {
    testPdf: "files/quiroga.pdf",
    loading: 0
  };

  loadFile() {
    let loading = this.state.pdf.getDocument({
      url: this.state.testPdf
    });

    let actual = 0;
    loading.onProgress = progressData => {
      let temp = Math.round((progressData.loaded * 100) / progressData.total);
      actual = temp > 100 ? actual : temp;
      this.setState({
        loading: actual
      });
    };
  }

  componentWillMount() {
    // Use cdn worker
    var url = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
      PDF.version
    }/pdf.worker.js`;
    PDF.GlobalWorkerOptions.workerSrc = url;

    this.setState({
      pdf: PDF
    });
  }

  componentDidMount() {
    this.loadFile();
  }

  render() {
    return (
      <div>
        PDF.JS
        {this.state.loading ? <p>{this.state.loading + "%"}</p> : null}
      </div>
    );
  }
}
