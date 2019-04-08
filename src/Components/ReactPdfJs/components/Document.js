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
      currentRotation: 0,
      lastY: 0 // Just for prevent bug on manual and automatic scroll
    };
  }

  componentWillMount() {
    // Configure the pdf.js worker. Use current version worker from CDN instead the one
    // in node_modules because it doesn't work as expected when it's imported.
    if (!this.props.settings.workerURL) {
      pdfJsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
        pdfJsLib.version
      }/pdf.worker.js`;
    }

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

    // Add event listener to scroll. Using pdf.js watchScroll function
    watchScroll(this.pdfRef.current, data => {
      if (!this.state.forcedScrolling) this.setPageNumberByScroll(data);
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
      // Simple 3 rule - (loaded * 100%) / total = current%
      let temp = Math.round((progressData.loaded * 100) / progressData.total);
      // Sometimes, I don't know why, progressData.loaded is bigger than
      // progressData.total size. In that case, we should keep previous %
      loading = temp > 100 ? loading : temp;
      // Store in state
      this.setState({ loading });
    };

    // After the file is loaded, retrieve pdf information and object and store
    // them in the state. Then, proceed to store each page.
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

  /**
   * Store viewer width and height in state.
   */
  setupViewerSize = () => {
    let pdfContainer = this.pdfRef.current;
    const viewerWidth = pdfContainer.clientWidth;
    const viewerHeight = pdfContainer.clientHeight;

    this.setState({ viewerWidth, viewerHeight });
  };

  /**
   * Store each page in the state.
   */
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

    // After storing all pages in the state, start to display them
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

  /**
   * Display the current page and the next and above. Displaying all pages could
   * generate memory issues.
   *
   * pagesInMemoryBefore: this setting says how many previous pages should show
   * pagesInMemoryAfter: this setting says how many next pages should show
   *
   * @param {function} callback
   */
  setPagesToDisplay = callback => {
    const { currentPage, pages, totalPages, pagesIndex } = this.state;
    const { pagesInMemoryBefore, pagesInMemoryAfter } = this.props.settings;

    // Array for storing which pages should be rendered
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

    // If page is in queue array, set display to true. This will
    // trigger rendering in Page.js
    pagesIndex.forEach(num => {
      updatedPages[num].display = queue.indexOf(num) > -1;
    });

    this.setState({ pages: updatedPages }, () => {
      if (callback) callback();
    });
  };

  /**
   * This function is executed when the user is doing scroll. Refresh the page
   * number based on the current viewer scroll position.
   *
   * @param {{}} scrollData Scroll object retrieved by pdf.js watchScroll function
   */
  setPageNumberByScroll = scrollData => {
    // If it's automatic scroll just prevent execution.
    if (this.state.forcedScrolling) return false;

    // If pages positions aren't in cache, just call storeInCachePositions passing
    // this function as callback
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
    // If the lastY position is the same as the current, prevent execution, if not,
    // store the current position in the state.
    // In a future we should delete this, or use a better alternative. It now exists
    // because animateIt function used by goToPate buttons triggers two scroll actions
    if (this.state.lastY !== lastY) {
      this.setState({ lastY });
    } else {
      return;
    }

    let middle = lastY - viewerHeight / 2.5;

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

  /**
   * We store the pages positions in cache. This cache is used by setPageNumberByScroll
   *
   * @param {function} callback Function that will be executed when the function finishes
   */
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

  /**
   * Handles Toolbar's prev and next button actions.
   *
   * @param {boolean} prev If we should go to previous page
   */
  onGoToPage = prev => {
    const { currentPage, totalPages, cachedPositions } = this.state;
    let newPage = prev ? currentPage - 1 : currentPage + 1;
    // if the newPage doesn't exists, quit function
    if (newPage === 0 || newPage > totalPages) return;

    // We set forcedScrolling to true, for preventing setPageNumberByScroll
    // getting triggered
    this.setState({ forcedScrolling: true });

    // If pages positions aren't in cache yet, call storeInCachePositions passing
    // this function as callback
    if (!cachedPositions) {
      this.storeInCachePositions(() => this.onGoToPage(prev));
      return;
    }

    // Set the current page
    this.setState({ currentPage: newPage });

    const viewer = this.pdfRef.current;
    const offsetTop = cachedPositions[newPage].offsetTop;
    animateIt(viewer, offsetTop, 75, "easeInOutQuad", 300, () => {
      // Store lastY position, forcedScrolling to false
      this.setState({ forcedScrolling: false, lastY: offsetTop - 75 }, () => {
        // and then update which pages should we render
        this.setPagesToDisplay();
      });
    });
  };

  /**
   * Change the zoom using the current scale and the zoom step
   *
   * @param {boolean} minus if is zoom out
   */
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

  /**
   * Rotate the file
   *
   * @param {boolean} ccw If is counter clockwise
   */
  onRotate = ccw => {
    const { currentRotation } = this.state;
    const angleChange = ccw ? 270 : 450; // 270: 360 - 90, 450: 360 + 90
    const finalRotation = (currentRotation + angleChange) % 360;

    this.setState({ currentRotation: finalRotation }, () => {
      window.setTimeout(() => {
        this.storeInCachePositions();
      }, 100);
    });
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
