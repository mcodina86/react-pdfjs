import React from "react";
import PDF from "pdfjs-dist";
import Page from "./components/Page";
import Toolbar from "./components/Toolbar";
import { sendEvent } from "./utils/events";
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
      testPdf: "files/quiroga.pdf",
      currentPage: 1,
      loading: 0,
      pagesIndex: [],
      settings: settingsToUse,
      fileProperties: { name: "", pages: 0 },
      viewerSize: { width: 0, height: 0 },
      options: {
        pagesInMemoryBefore: 3,
        pagesInMemoryAfter: 3
      }
    };
  }

  configureSettings = () => {
    const receivedSettings = this.props.settings;

    // Use default settings when settings props is empty
    if (!receivedSettings) return settings;

    let settingsToUse = {};

    // Check display settings
    let displaySettings = settings.display;
    if (receivedSettings.display) {
      displaySettings = {
        ...settings.display,
        ...receivedSettings.display
      };
    }

    // Check rendering settings
    let renderingSettings = settings.rendering;
    if (receivedSettings.rendering) {
      renderingSettings = {
        ...settings.rendering,
        ...receivedSettings.rendering
      };
    }

    settingsToUse = {
      ...settings,
      display: displaySettings,
      rendering: renderingSettings
    };

    return settingsToUse;
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
      let fileProperties = {
        name: getPDFFileNameFromURL(urlToUse, "Unknown Document"),
        pages: pdfProxy.numPages
      };
      // When the pdf is loaded, store pdfProxy object in the state
      this.setState({ pdfProxy, fileProperties });
      // and then the pages.
      this.storePagesInState();
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
        let viewport = res.getViewport(settings.display.currentScale);
        var sizes = {
          width: viewport.width,
          height: viewport.height
        };

        let pageToSave = {
          sizes: sizes,
          obj: res,
          rendered: false,
          position: { x: 0, y: 0 },
          display: false,
          txt: null
        };
        pages[res.pageNumber] = pageToSave;
      });
      this.setState({ pagesIndex, pages });
      sendEvent("pagesstored");
      this.start();
    });
  }

  start() {
    this.setPagesToDisplay();
    sendEvent("pdfloaded");
  }

  setPagesToDisplay = () => {
    const {
      currentPage,
      pagesIndex,
      pages,
      options,
      fileProperties
    } = this.state;
    pagesIndex.forEach(num => {
      pages[num].display = false;
    });

    let pagesToLoad = {};
    let firstPageToLoad = pages[currentPage];
    firstPageToLoad.display = true;
    pagesToLoad[currentPage] = firstPageToLoad;

    if (options.pagesInMemoryBefore > 0) {
      for (var i = 1; i <= options.pagesInMemoryBefore; i++) {
        if (currentPage - i > 0) {
          pagesToLoad[currentPage - i] = pages[currentPage - i];
          pagesToLoad[currentPage - i].display = true;
        }
      }
    }

    if (options.pagesInMemoryBefore > 0) {
      for (var j = 1; j <= options.pagesInMemoryBefore; j++) {
        if (currentPage + j <= fileProperties.pages) {
          pagesToLoad[currentPage + j] = pages[currentPage + j];
          pagesToLoad[currentPage + j].display = true;
        }
      }
    }

    const pagesToStore = { ...pages, pagesToLoad };
    this.setState({ pages: pagesToStore });
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
    const { pagesIndex, pages, currentPage, isWorking } = this.state;
    if (isWorking) return false;
    let { lastY } = scrollData;

    // let middle = lastY - viewerSize.height / 2;
    let middle = lastY;

    // Sometimes it doesn't work if you quickly scroll to top
    if (middle <= 1) {
      if (currentPage !== 1) {
        this.setState({ currentPage: 1 });
        this.setPagesToDisplay();
      }
      return;
    }

    let positions = pagesIndex.map(num => pages[num].position.y);

    let closest = positions.reduce(function(prev, curr) {
      return Math.abs(curr - middle) < Math.abs(prev - middle) ? curr : prev;
    });

    if (currentPage !== positions.indexOf(closest) + 1) {
      this.setState({ currentPage: positions.indexOf(closest) + 1 });
      this.setPagesToDisplay();
    }
  };

  attachPositions = (pageNumber, positions) => {
    let page = this.state.pages[pageNumber];
    page.position = positions;
    let newPages = { ...this.state.pages, pageNumber: page };
    this.setState({ pages: newPages });
  };

  onGoToPage = (prev = false) => {
    const { currentPage, fileProperties, pages, isWorking } = this.state;

    if (isWorking) return;

    this.setState({ isWorking: true });

    let newPage = prev ? currentPage - 1 : currentPage + 1;
    if (newPage > fileProperties.pages || newPage < 1) return;

    // get page position
    const page = pages[newPage];
    const viewer = this.pdfRef.current;
    animateIt(viewer, page.position.y, 100, "easeInOutQuad", 400, () => {
      this.setState({ isWorking: false });
    });
  };

  render() {
    const {
      pagesIndex,
      pages,
      loading,
      settings,
      fileProperties,
      currentPage
    } = this.state;
    return (
      <div>
        {loading ? <p>{loading + "%"}</p> : null}

        <div className="viewer">
          <Toolbar
            file={fileProperties}
            currentPage={currentPage}
            goToPage={this.onGoToPage}
          />
          <div className="pdf" ref={this.pdfRef}>
            {pagesIndex.map(number => {
              return (
                <Page
                  number={number}
                  page={pages[number]}
                  settings={settings}
                  key={number}
                  onPositionsSetted={this.attachPositions}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}
