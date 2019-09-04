import pdfJsLib from "pdfjs-dist";

const settings = {
  minScale: 0.2,
  maxScale: 5,
  zoomStep: 0.2,
  currentScale: 1,
  emptySpace: 75,
  rotation: 0,
  startPage: 1,
  pagesInMemoryBefore: 2,
  pagesInMemoryAfter: 2,
  allowTextRendering: false,
  debug: false,
  cleanMemory: true,
  exampleUrl: "files/quiroga.pdf",
  // prettier-ignore
  workerURL: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJsLib.version}/pdf.worker.js`
};

/**
 * @param {Object} receivedSettings
 */
const getSettings = receivedSettings => {
  if (!receivedSettings) return settings;

  let settingsToUse = {};

  settingsToUse = {
    ...settings,
    ...receivedSettings
  };

  return settingsToUse;
};

export default getSettings;
