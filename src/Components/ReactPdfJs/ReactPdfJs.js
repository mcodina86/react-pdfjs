import React from "react";
import PDF from "pdfjs-dist";
import Document from "./components/Document";
import Page from "./components/Page";
import Progressbar from "./components/Progressbar";
import Toolbar from "./components/Toolbar";
// import { sendEvent } from "./utils/events";
import {
  watchScroll,
  animateIt,
  getPDFFileNameFromURL
} from "./utils/ui_utils";
import settings from "./core/settings";
import "./styles.css";

export default class ReactPdfJs extends React.Component {
  constructor(props) {
    super(props);
    this.pdfRef = React.createRef();
    const settingsToUse = this.configureSettings();

    this.state = {
      currentPage: 1,
      loading: 0,
      settings: settingsToUse,
      fileProperties: { name: "", pages: 0 },
      pagesIndex: [],
      pages: {},
      renderQueue: [],
      currentScale: settingsToUse.currentScale
    };
  }

  configureSettings = () => {
    const receivedSettings = this.props.settings;

    // Use default settings when settings props is empty
    if (!receivedSettings) return settings;

    let settingsToUse = {};

    settingsToUse = {
      ...settings,
      ...receivedSettings
    };
    return settingsToUse;
  };

  /**
   * Load the file in PDF.js
   */
  loadFile() {
    const { pdf, settings } = this.state;
    const { url } = this.props;

    // If url prop exists, use that, instead, use test PDF
    let urlToUse = url ? url : settings.exampleUrl;

    let loadingObject = pdf.getDocument({
      url: urlToUse
    });

    // Update loading percentage using onProgress information from PDF.js
    let loading = 0;

    let start = performance.now();
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
      let fileProperties = {
        name: getPDFFileNameFromURL(urlToUse, "Unknown Document"),
        pages: pdfProxy.numPages
      };
      // When the pdf is loaded, store pdfProxy object in the state
      this.setState({ pdfProxy, fileProperties }, () => {
        this.storePagesInState();
        let total = performance.now() - start;
        console.debug(`Loading file took ${Math.round(total)}ms`);
      });
    });
  }

  storePagesInState() {
    // get pdfProxy from state
    const { pdfProxy, settings } = this.state;

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
        let viewport = res.getViewport(settings.currentScale);

        let pageToSave = {
          offsetTop: 0,
          offsetLeft: 0,
          width: viewport.width,
          height: viewport.height,
          display: false,
          pageObject: res,
          ref: React.createRef()
        };
        pages[res.pageNumber] = pageToSave;
      });
      this.setState({ pagesIndex, pages }, () => {
        this.setPagesToDisplay();
      });
    });
  }

  setPagesToDisplay = callback => {
    const {
      currentPage,
      pagesIndex,
      pages,
      settings,
      fileProperties
    } = this.state;

    const { pagesInMemoryBefore, pagesInMemoryAfter } = settings;
    let queue = [currentPage];

    for (var i = 1; i <= parseInt(pagesInMemoryBefore); i++) {
      if (currentPage - i > 0) {
        queue.push(currentPage - i);
      }
    }

    for (var j = 1; j <= parseInt(pagesInMemoryAfter); j++) {
      if (currentPage + j <= fileProperties.pages) {
        queue.push(currentPage + j);
      }
    }

    let updatedPages = {};
    /** setup positions and display */
    pagesIndex.forEach(number => {
      let page = pages[number];
      let div = page.ref.current;
      page.offsetLeft = div.offsetLeft;
      page.offsetTop = div.offsetTop;
      page.display = queue.indexOf(number) > -1;
      updatedPages[number] = page;
    });

    this.setState({ pages: updatedPages }, () => {
      if (callback) callback();
    });
    return queue;
  };

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

    document.addEventListener("pdfloaded", () => {
      console.debug("PDF loaded");
    });
  }

  componentDidMount() {
    // When component is mounted, load the file
    this.loadFile();

    let pdfContainer = this.pdfRef.current;
    this.setupViewerSize();

    window.addEventListener("resize", () => {
      this.setupViewerSize();
    });

    watchScroll(pdfContainer, data => {
      this.setPageNumberByScroll(data);
    });
  }

  setupViewerSize = () => {
    let pdfContainer = this.pdfRef.current;
    let viewerSize = {
      width: pdfContainer.clientWidth,
      height: pdfContainer.clientHeight
    };
    this.setState({ viewerSize });
  };

  setPageVisible = number => {
    var newPageState = this.state.pages[number];
    newPageState.display = true;
    var tempObject = {};
    tempObject[number] = newPageState;
    var newPagesState = { ...this.state.pages, tempObject };
    this.setState({ pages: newPagesState });
  };

  setPageNumberByScroll = scrollData => {
    if (this.state.forcedScrolling) return false;

    const { pagesIndex, pages, currentPage, viewerSize } = this.state;

    let { lastY } = scrollData;

    let middle = lastY - viewerSize.height / 2;
    // let middle = lastY;

    // Sometimes it doesn't work if you quickly scroll to top
    if (middle <= 1) {
      if (currentPage !== 1) {
        this.setState({ currentPage: 1 });
        this.setPagesToDisplay();
      }
      return;
    }

    let positions = pagesIndex.map(num => pages[num].offsetTop);

    let closest = positions.reduce(function(prev, curr) {
      return Math.abs(curr - middle) < Math.abs(prev - middle) ? curr : prev;
    });

    if (currentPage !== positions.indexOf(closest) + 1) {
      this.setState({ currentPage: positions.indexOf(closest) + 1 });
      this.setPagesToDisplay();
    }
  };

  onGoToPage = (prev = false) => {
    const { currentPage, fileProperties, pages, forcedScrolling } = this.state;

    if (forcedScrolling) return;

    this.setState({ forcedScrolling: true });

    let newPage = prev ? currentPage - 1 : currentPage + 1;
    if (newPage > fileProperties.pages || newPage < 1) return;

    // get page position
    const page = pages[newPage];
    const viewer = this.pdfRef.current;
    animateIt(viewer, page.offsetTop, 100, "easeInOutQuad", 200, () => {
      this.setState({ forcedScrolling: false });
    });
  };

  render() {
    const {
      pagesIndex,
      pages,
      loading,
      fileProperties,
      currentPage,
      currentScale
    } = this.state;
    return (
      <div>
        {loading ? <Progressbar loading={loading} /> : null}

        <div className="viewer">
          <Toolbar
            name={fileProperties.name}
            page={currentPage}
            total={fileProperties.pages}
            goToPage={this.onGoToPage}
          />
          <Document ref={this.pdfRef}>
            {pagesIndex.map(number => {
              const page = pages[number];
              return (
                <div
                  key={number}
                  className={`page page-${number}`}
                  ref={page.ref}
                  style={{ width: page.width, height: page.height }}
                >
                  <Page
                    width={page.width}
                    height={page.height}
                    page={page.pageObject}
                    display={page.display}
                    scale={currentScale}
                  />
                </div>
              );
            })}
          </Document>
        </div>
      </div>
    );
  }
}
