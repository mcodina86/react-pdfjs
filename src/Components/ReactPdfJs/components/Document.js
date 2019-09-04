import React, { useState, useEffect, useRef } from "react";
import pdfJsLib from "pdfjs-dist";
import { startDebug, endDebug, debugFunction } from "../utils/debugger";
import { getPDFFileNameFromURL, closestIndex } from "../utils/utils";

// Components
import Page from "./Page";
import Progressbar from "./Progressbar";
import Toolbar from "./Toolbar/";

const Document = props => {
  /**
   * Create the ref
   */
  const pdfRef = useRef();
  const viewerRef = useRef();

  /**
   * Setup pdfJsLib Worker
   */
  pdfJsLib.GlobalWorkerOptions.workerSrc = props.workerURL;

  /**
   * Create the default state of the app
   */
  const [currentPage, setCurrentPage] = useState(props.startPage);
  const [nextPage, setNextPage] = useState(0);
  const [pagesIndex, setPagesIndex] = useState([]);
  const [pages, setPages] = useState(null);
  const [positions, setPositions] = useState([]);
  const [sizesLoaded, setSizesLoaded] = useState(false);
  const [scale, setScale] = useState(props.currentScale);
  const [rotation, setRotation] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [pdfProxy, setPdfProxy] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  let pagesSizeLoaded = 0;

  useEffect(() => {
    pdfRef.current.addEventListener("scroll", scrollFx);
    return () => pdfRef.current.removeEventListener("scroll", scrollFx);
  });

  useEffect(() => init(), []);
  useEffect(() => storePagesInState(), [pdfProxy]);
  useEffect(() => setPagesToDisplay(true), [pages, pagesIndex]);
  useEffect(() => storePagesPositions(), [sizesLoaded]);
  useEffect(() => doingZoom(), [scale]);
  useEffect(() => updatePageNumber(), [nextPage]);
  useEffect(() => setPagesToDisplay(), [currentPage]);

  const init = () => {
    debugFunction(loadFile, "Loading File", props.debug);
  };

  const storePagesPositions = () => {
    if (sizesLoaded) {
      const positions = pagesIndex.map(pi => {
        return pages[pi].ref.current.offsetTop;
      });

      setPositions(positions);

      pagesSizeLoaded = 0;
    }
  };

  const doingZoom = () => {
    if (props.currentScale !== scale) {
      recoverLostOffset();
    }
  };

  const updatePageNumber = () => {
    if (nextPage === 0) return;
    if (currentPage !== nextPage) setCurrentPage(nextPage);
  };

  const scrollFx = data => {
    const lastY = pdfRef.current.scrollTop;
    if (positions.length > 0) {
      let closest = parseInt(closestIndex(positions, lastY));
      closest += 1;
      setNextPage(closest);
    }
  };

  const recoverLostOffset = () => {
    if (!pages) return;

    if (pagesSizeLoaded === totalPages || pagesSizeLoaded === 0) {
      const pageToUse = pages[1].ref.current;
      const curr = currentPage === 1 ? 1 : currentPage - 1;
      const whiteSpace = 40; // TODO
      const scrollY = pdfRef.current.scrollTop;

      var zoomedPixels = (pageToUse.offsetHeight * props.zoomStep - whiteSpace) * curr;
      pdfRef.current.scrollTo(null, scrollY + zoomedPixels);
    } else {
      console.log("Try again");
      recoverLostOffset();
    }
  };

  const loadFile = () => {
    const url = props.url || props.exampleUrl;
    // If url prop exists, use that, instead, use test PDF
    let loadingObject = pdfJsLib.getDocument({ url });
    // Update loaded percentage
    loadingObject.onProgress = progressData => {
      let tempLoaded = Math.round((progressData.loaded * 100) / progressData.total);
      setLoaded(tempLoaded > 100 ? 100 : tempLoaded);
    };

    loadingObject.promise.then(proxy => {
      setFileName(getPDFFileNameFromURL(url, "Unknown Document"));
      setPdfProxy(proxy);
    });
  };

  const storePagesInState = () => {
    if (!pdfProxy) return;
    const start = startDebug();
    const numPages = pdfProxy.numPages;
    setTotalPages(numPages);

    // Instead storing the pages in an array, we use an object
    let pagesMap = {};
    let pagesArray = [];

    // Promises container
    let allPromises = [];

    // Use for loop for creating pages objects and start loading the pages with PDFjs.getPage
    for (let i = 1; i <= numPages; i++) {
      pagesArray.push(i);
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
        pagesMap[res.pageNumber] = pageToSave;
      });
      setPages(pagesMap);
      setPagesIndex(pagesArray);
      if (props.debug) endDebug(start, "Store pages in memory");
    });
  };

  /**
   *
   * @param {*} first
   */
  const setPagesToDisplay = first => {
    if (!first && !nextPage) return;
    if (!pages || pagesIndex.length === 0) return;

    const { pagesInMemoryBefore, pagesInMemoryAfter } = props;
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
    setPages(updatedPages);
  };

  const onSetPrepared = () => {
    pagesSizeLoaded++;
    if (totalPages === pagesSizeLoaded) {
      setSizesLoaded(true);
    }
  };

  /**
   * @param {boolean} backwards
   */
  const onGoToPage = (backwards = false) => {
    console.log(backwards);
  };

  /**
   * @param {boolean} ccw
   */
  const onRotate = (ccw = false) => {
    const angleChange = ccw ? 270 : 450; // 270: 360 - 90, 450: 360 + 90
    const finalRotation = (rotation + angleChange) % 360;
    setRotation(finalRotation);
  };

  /**
   * @param {-1|0|1} direction
   */
  const onDoZoom = direction => {
    const { minScale, maxScale, zoomStep } = props;
    const defaultScale = props.currentScale;
    let newScale;
    if (direction === 0) {
      newScale = defaultScale;
    } else if (direction > 0) {
      newScale = scale + zoomStep;
    } else {
      newScale = scale - zoomStep;
    }

    if (newScale > maxScale || newScale < minScale) return;
    if (scale === newScale) return;

    setSizesLoaded(false);
    setScale(newScale);
  };

  return (
    <div className="viewer" ref={viewerRef}>
      <Toolbar name={fileName} page={currentPage} total={totalPages} goToPage={onGoToPage} rotate={onRotate} doZoom={onDoZoom} />
      <Progressbar loading={loaded} />
      <div className="pdf" ref={pdfRef}>
        {pagesIndex.map(num => {
          let page = pages[num];
          return (
            <div key={num} ref={page.ref}>
              <Page number={num} obj={page.pageObject} display={page.display} settings={props} rotation={rotation} scale={scale} setPrepared={onSetPrepared} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Document;
