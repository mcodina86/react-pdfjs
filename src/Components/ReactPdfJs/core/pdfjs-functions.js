import { getOutputScale } from "../utils/ui_utils";

export const getViewport = (page, scale, rotation) => {
  let viewport = page.getViewport(scale, rotation);

  return viewport;
};

/**
 * Render the page in the gived canvas.
 *
 * @param {Object} page pdf.js page object
 * @param {HTMLCanvasElement} canvas
 * @param {Object} settings
 * @param {Function} callback
 * @param {Function} error
 */
export const renderPage = (page, canvas, scale, callback, error) => {
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

  let canvasContext = canvas.getContext("2d");
  let outputScale = getOutputScale(canvasContext);
  let viewport = page.getViewport(scale, 0);

  let transform = !outputScale.scaled
    ? null
    : [outputScale.sx, 0, 0, outputScale.sy, 0, 0];

  let renderContext = { canvasContext, viewport, transform };

  canvas.width = viewport.width * outputScale.sx;
  canvas.height = viewport.height * outputScale.sy;

  page
    .render(renderContext)
    .then(() => {
      if (typeof callback === "function") callback(page);
      /* if (settings.rendering.selectText) {
          obj.getTextContent().then(textContent => {
            var svg = buildSVG(viewport, textContent);
            this.containerRef.current.appendChild(svg);
          });
        } */
      return page;
    })
    .catch(err => {
      console.error(err);
      if (typeof error === "function") error();
    });
};
