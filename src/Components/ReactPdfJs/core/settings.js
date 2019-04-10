const settings = {
  minScale: 0.2,
  maxScale: 5,
  zoomStep: 0.2,
  currentScale: 1,
  emptySpace: 75,
  rotation: 0,
  startPage: 1,
  pagesInMemoryBefore: 1,
  pagesInMemoryAfter: 2,
  allowTextRendering: false,
  debug: false,
  cleanMemory: true,
  exampleUrl: "files/quiroga.pdf",
  workerURL: null
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
