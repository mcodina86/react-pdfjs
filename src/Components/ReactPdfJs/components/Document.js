import React from "react";
import Page from "./Page";
/* import Progressbar from "./components/Progressbar"; */
import Toolbar from "./Toolbar";
import {
  watchScroll,
  getPDFFileNameFromURL,
  animateIt
} from "../utils/ui_utils";
import { startDebug, endDebug } from "../utils/debugger";
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
      currentScale: props.settings.currentScale,
      currentRotation: 0
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
    let start = startDebug();
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

        if (settings.debug) endDebug(start, "Loading file");
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
    const start = startDebug();

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
        if (this.props.settings.debug) endDebug(start, "Store pages in memory");

        this.setPagesToDisplay();
      });
    });
  };

  setPagesToDisplay = callback => {
    const { currentPage, pages, totalPages, pagesIndex } = this.state;
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

    pagesIndex.forEach(num => {
      updatedPages[num].display = queue.indexOf(num) > -1;
    });

    this.setState({ pages: updatedPages }, () => {
      if (callback) callback();
    });
  };

  setPageNumberByScroll = scrollData => {
    if (this.state.forcedScrolling) return false;

    if (!this.state.cachedPositions) {
      this.storeInCachePositions(() => this.setPageNumberByScroll(scrollData));
      return;
    }

    const {
      pagesIndex,
      currentPage,
      cachedPositions,
      viewerHeight
    } = this.state;

    let { lastY } = scrollData;

    let middle = lastY - viewerHeight / 2;

    // Sometimes it doesn't work if you quickly scroll to top
    if (middle <= 1) {
      if (currentPage !== 1) {
        this.setState({ currentPage: 1 });
        this.setPagesToDisplay();
      }
      return;
    }

    let positions = pagesIndex.map(num => cachedPositions[num].offsetTop);

    let closest = positions.reduce(function(prev, curr) {
      return Math.abs(curr - middle) < Math.abs(prev - middle) ? curr : prev;
    });

    if (currentPage !== positions.indexOf(closest) + 1) {
      this.setState({ currentPage: positions.indexOf(closest) + 1 }, () => {
        this.setPagesToDisplay();
      });
    }
  };

  storeInCachePositions = callback => {
    const start = startDebug();

    const { pagesIndex, pages } = this.state;
    let cachedPositions = {};

    pagesIndex.forEach(number => {
      let page = pages[number];
      cachedPositions[number] = {
        offsetTop: page.ref.current.offsetTop,
        offsetLeft: page.ref.current.offsetleft
      };
    });

    this.setState({ cachedPositions }, () => {
      if (this.props.settings.debug) endDebug(start, "Get positions");
      if (callback) callback();
    });
  };

  onGoToPage = prev => {
    const { currentPage, totalPages, cachedPositions } = this.state;
    let newPage = prev ? currentPage - 1 : currentPage + 1;
    if (newPage === 0 || newPage > totalPages) return;

    if (!cachedPositions) {
      this.storeInCachePositions(() => this.onGoToPage(prev));
      return;
    }

    this.setState({ forcedScrolling: true });

    const viewer = this.pdfRef.current;
    const offsetTop = cachedPositions[newPage].offsetTop;
    animateIt(viewer, offsetTop, 100, "easeInOutQuad", 200, () => {
      this.setState({ forcedScrolling: false });
    });
  };

  onDoZoom = minus => {
    const { minScale, maxScale, zoomStep } = this.props.settings;
    const { currentScale } = this.state;
    let newScale = minus ? currentScale - zoomStep : currentScale + zoomStep;
    if (newScale > maxScale || newScale < minScale) return;

    this.setState({ currentScale: newScale }, () => {
      window.setTimeout(() => {
        this.storeInCachePositions();
      }, 100);
    });
  };

  onRotate = ccw => {
    const { currentRotation } = this.state;
    const angleChange = ccw ? 270 : 450; // 270: 360 - 90, 450: 360 + 90
    const finalRotation = (currentRotation + angleChange) % 360;

    console.log(finalRotation);
    this.setState({ currentRotation: finalRotation });
  };

  render() {
    const {
      pages,
      pagesIndex,
      currentScale,
      fileName,
      currentPage,
      totalPages,
      currentRotation
    } = this.state;

    return (
      <div className="viewer" ref={this.viewerRef}>
        <Toolbar
          name={fileName}
          page={currentPage}
          total={totalPages}
          goToPage={this.onGoToPage}
          rotate={this.onRotate}
          doZoom={this.onDoZoom}
        />
        <div className="pdf" ref={this.pdfRef}>
          {pagesIndex.map(num => {
            let page = pages[num];
            return (
              <div key={num} ref={page.ref}>
                <Page
                  number={num}
                  obj={page.pageObject}
                  display={page.display}
                  settings={this.props.settings}
                  rotation={currentRotation}
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
