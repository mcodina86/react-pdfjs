import React from "react";
import Page from "./Page";
/* import Progressbar from "./components/Progressbar";
import Toolbar from "./components/Toolbar"; */
import { watchScroll, getPDFFileNameFromURL } from "../utils/ui_utils";
import pdfJsLib from "pdfjs-dist";
export default class Document extends React.Component {
  constructor(props) {
    super(props);

    this.pdfRef = React.createRef();
    this.viewerRef = React.createRef();
    this.state = {
      currentPage: props.settings.startPage,
      pages: {},
      pagesIndex: [],
      currentScale: props.settings.currentScale
    };
  }

  componentWillMount() {
    // Configure the pdf.js worker. Use current version worker from CDN instead the one
    // in node_modules because it doesn't work as expected when it's imported.
    let url = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
      pdfJsLib.version
    }/pdf.worker.js`;

    // Setup the worker url
    pdfJsLib.GlobalWorkerOptions.workerSrc = url;

    // Update the PDF object in the state
    this.setState({ pdf: pdfJsLib });

    // Add resize event listener
    window.addEventListener("resize", () => {
      this.setupViewerSize();
    });
  }

  componentDidMount() {
    // First, setup viewer size
    this.setupViewerSize();
    // Then load the file
    this.loadFile();

    watchScroll(this.pdfRef.current, data => {
      this.setPageNumberByScroll(data);
    });
  }

  /**
   * Custom functions
   */

  /**
   * Load the file with PDF.js
   */
  loadFile = () => {
    let start = performance.now();
    const { pdf } = this.state;
    const { url, settings } = this.props;

    // If url prop exists, use that, instead, use test PDF
    let urlToUse = url ? url : settings.exampleUrl;

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
      const fileName = getPDFFileNameFromURL(urlToUse, "Unknown Document");
      const totalPages = pdfProxy.numPages;

      // When the pdf is loaded, store pdfProxy object in the state
      this.setState({ pdfProxy, fileName, totalPages }, () => {
        this.storePagesInState();

        if (settings.debug) {
          let total = performance.now() - start;
          console.debug(
            `[react-pdfjs] Loading file took ${Math.round(total)}ms`
          );
        }
      });
    });
  };

  setupViewerSize = () => {
    let pdfContainer = this.pdfRef.current;
    const viewerWidth = pdfContainer.clientWidth;
    const viewerHeight = pdfContainer.clientHeight;

    this.setState({ viewerWidth, viewerHeight });
  };

  storePagesInState = () => {
    const { pdfProxy, totalPages } = this.state;
    const start = performance.now();

    // Instead storing the pages in an array, we use an object
    let pages = {};
    // And array which contains all pages indexes
    let pagesIndex = [];

    // Promises container
    let allPromises = [];

    // Use for loop for creating pages objects and start loading the pages with PDFjs.getPage
    for (let i = 1; i <= totalPages; i++) {
      pagesIndex.push(i);
      allPromises.push(pdfProxy.getPage(i));
    }

    Promise.all(allPromises).then(result => {
      result.forEach(res => {
        let pageToSave = {
          display: false,
          pageObject: res,
          ref: React.createRef()
        };
        pages[res.pageNumber] = pageToSave;
      });
      this.setState({ pagesIndex, pages }, () => {
        if (this.props.settings.debug) {
          const total = performance.now() - start;
          console.debug(
            `[react-pdfjs] Store pages in memory took ${Math.round(total)}ms`
          );
        }
        this.setPagesToDisplay();
      });
    });
  };

  setPagesToDisplay = callback => {
    const { currentPage, pages, totalPages } = this.state;
    const { pagesInMemoryBefore, pagesInMemoryAfter } = this.props.settings;

    let queue = [currentPage];

    for (var i = 1; i <= parseInt(pagesInMemoryBefore); i++) {
      if (currentPage - i > 0) {
        queue.push(currentPage - i);
      }
    }

    for (var j = 1; j <= parseInt(pagesInMemoryAfter); j++) {
      if (currentPage + j <= totalPages) {
        queue.push(currentPage + j);
      }
    }

    let updatedPages = pages;

    queue.forEach(number => {
      updatedPages[number].display = true;
    });

    this.setState({ pages: updatedPages }, () => {
      if (callback) callback();
    });
  };

  render() {
    const { pages, pagesIndex, currentScale } = this.state;
    return (
      <div className="viewer" ref={this.viewerRef}>
        <div className="pdf" ref={this.pdfRef}>
          {pagesIndex.map(num => {
            let page = pages[num];
            return (
              <div key={num} ref={page.ref}>
                <Page
                  number={num}
                  obj={page.pageObject}
                  display={page.display}
                  debug={this.props.settings.debug}
                  scale={currentScale}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

/*

const Document = React.forwardRef((props, ref) => (
  <div className="pdf" ref={ref}>
    {props.children}
  </div>
));

export default Document;
*/
