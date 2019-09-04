import { getOutputScale } from "../utils/utils";

export const getViewport = (page, scale, rotation) => {
  const options = { scale, rotation };
  let viewport = page.getViewport(options);

  return viewport;
};

/**
 * Render the page in the gived canvas.
 *
 * @param {{}} page pdf.js page object
 * @param {HTMLCanvasElement} canvas
 * @param {number} scale
 * @param {Function} callback
 * @param {Function} error
 */
export const renderPage = (page, canvas, viewport, callback, error) => {
  if (!canvas) {
    console.error("renderPage need a canvas!");
    if (typeof error === "function") error();
    return;
  }

  if (!page) {
    console.error("renderPage need a page object!");
    if (typeof error === "function") error();
    return;
  }

  const canvasContext = canvas.getContext("2d");
  let outputScale = getOutputScale(canvasContext);

  let transform = !outputScale.scaled
    ? null
    : [outputScale.sx, 0, 0, outputScale.sy, 0, 0];

  let renderContext = { canvasContext, viewport, transform };

  canvas.width = viewport.width * outputScale.sx;
  canvas.height = viewport.height * outputScale.sy;

  var pageProm = page.render(renderContext).promise;

  pageProm.then(() => {
    if (typeof callback === "function") callback(page);
    return page;
  });

  pageProm.catch(error => {
    console.error(error);
    if (typeof error === "function") error();
  });
};
