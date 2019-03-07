import React from "react";
import PDF from "pdfjs-dist";
import Page from "./Components/Page";

export default class ReactPdfJs extends React.Component {
  state = {
    testPdf: "files/quiroga.pdf",
    loading: 0,
    pagesIndex: []
  };

  /**
   * Load the file in PDF.js
   */
  loadFile() {
    const { pdf, testPdf } = this.state;
    const { url } = this.props;

    // If url prop exists, use that, instead, use test PDF
    let urlToUse = url ? url : testPdf;

    let loadingObject = pdf.getDocument({
      url: urlToUse
    });

    // Update loading percentage using onProgress information from PDF.js
    let loading = 0;
    loadingObject.onProgress = progressData => {
      // Simple 3 rule
      // X === 100%
      // Y === Z
      // So, (Y * 100) / X = Z%
      let temp = Math.round((progressData.loaded * 100) / progressData.total);
      // Sometimes, I don't know why, progressData.loaded is bigger than
      // progressData.total size. In that case, we should keep previous %
      loading = temp > 100 ? loading : temp;
      // Store in state
      this.setState({ loading });
    };

    loadingObject.promise.then(pdfProxy => {
      // When the pdf is loaded, store pdfProxy object in the state
      this.setState({ pdfProxy });
      // and then the pages.
      this.storePagesInState();
    });
  }

  storePagesInState() {
    // get pdfProxy from state
    const { pdfProxy } = this.state;

    // Instead storing the pages in an array, we use an object
    let pages = {};
    // And array which contains all pages indexes
    let pagesIndex = [];
    // Promises container
    let allPromises = [];

    // Use for loop for creating pages objects and start loading the pages with PDFjs.getPage
    for (let i = 0; i < pdfProxy.numPages; i++) {
      let numPage = i + 1;
      pagesIndex.push(numPage);
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
    var newPageState = this.state.pages[54];
    newPageState.display = true;
    var newPagesState = { ...this.state.pages, 54: newPageState };
    this.setState({ pages: newPagesState });
  }

  componentWillMount() {
    // Configure the pdf.js worker. Use current version worker from CDN instead the one
    // in node_modules because it doesn't work as expected when it's imported.
    let url = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
      PDF.version
    }/pdf.worker.js`;

    // Setup the worker url
    PDF.GlobalWorkerOptions.workerSrc = url;

    // Update the PDF object in the state
    this.setState({ pdf: PDF });
  }

  componentDidMount() {
    // When component is mounted, load the file
    this.loadFile();
  }

  setPageVisible(number) {
    var newPageState = this.state.pages[number];
    newPageState.display = true;
    var tempObject = {};
    tempObject[number] = newPageState;
    var newPagesState = { ...this.state.pages, tempObject };
    this.setState({ pages: newPagesState });
  }

  render() {
    const { pagesIndex, pages, loading } = this.state;
    return (
      <div>
        PDF.JS
        <p>
          <button onClick={() => this.setPageVisible(41)}>
            Set 41 visible
          </button>
        </p>
        {loading ? <p>{loading + "%"}</p> : null}
        {pagesIndex.map(number => {
          return (
            <Page number={number} loaded={pages[number].display} key={number} />
          );
        })}
      </div>
    );
  }
}
