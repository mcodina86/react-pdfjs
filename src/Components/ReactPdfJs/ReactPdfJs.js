import React from "react";
import PDF from "pdfjs-dist";
import Page from "./Components/Page";

export default class ReactPdfJs extends React.Component {
  state = {
    testPdf: "files/quiroga.pdf",
    loading: 0,
    pagesIndex: []
  };

  loadFile() {
    const { pdf, testPdf } = this.state;

    let loading = pdf.getDocument({
      url: testPdf
    });

    let actual = 0;
    loading.onProgress = progressData => {
      let temp = Math.round((progressData.loaded * 100) / progressData.total);
      actual = temp > 100 ? actual : temp;
      this.setState({
        loading: actual
      });
    };

    loading.promise.then(pdfProxy => {
      this.setState({ pdfProxy });
      this.storePagesInState();
    });
  }

  storePagesInState() {
    const { pdfProxy } = this.state;

    let pages = {};
    let pagesIndex = [];
    let allPromises = [];

    for (let i = 0; i < pdfProxy.numPages; i++) {
      let numPage = i + 1;
      pagesIndex.push(numPage);
      pages[numPage] = { num: numPage };
      allPromises.push(pdfProxy.getPage(numPage));
    }

    Promise.all(allPromises).then(result => {
      result.forEach(res => {
        pages[res.pageNumber] = {
          obj: res,
          rendered: false,
          display: false
        };
      });
      this.setState({ pagesIndex, pages });
      this.start();
    });
  }

  start() {
    console.log(this.state);
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
    const { pagesIndex, pages, loading } = this.state;
    return (
      <div>
        PDF.JS
        {loading ? <p>{loading + "%"}</p> : null}
        {pagesIndex.map(number => {
          return <Page number={number} loaded={false} key={number} />;
        })}
      </div>
    );
  }
}
