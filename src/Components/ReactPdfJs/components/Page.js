import React from "react";
import { getViewport, renderPage } from "../core/pdfjs-functions";
import { getOutputScale, buildCanvas } from "../utils/ui_utils";
import "./Page.css";

export default class Page extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.containerRef = React.createRef();

    this.state = {
      firstRendering: true,
      scale: this.props.scale,
      width: this.props.width,
      height: this.props.height,
      cssWidth: this.props.width,
      cssHeight: this.props.height,
      working: false
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.display !== this.props.display) {
      return true;
    }

    if (nextProps.scale !== this.props.scale) {
      return true;
    }

    if (nextState.width !== this.state.width) {
      return true;
    }

    return false;
  }

  componentDidUpdate() {
    // Check if zoom is applied.
    let isZooming = this.state.scale !== this.props.scale;
    // First we check that the page should be rendered
    if (this.props.display === true) {
      // Check that the page isn't being rendered
      if (this.state.working) return;
      // Set the working state to true
      this.setState({ working: true });

      // First, setup elements sizes
      this.setupSizes(() => {
        // For calculate the time that took each page render
        const start = performance.now();

        // If is zooming, create temporary canvas
        let tempCanvas;
        if (isZooming) {
          const { width, height, cssWidth, cssHeight } = this.state;
          tempCanvas = buildCanvas(
            "tempCanvas",
            { width, height, cssWidth, cssHeight },
            this.containerRef.current,
            this.canvasRef.current
          );
        }

        // Start rendering the page
        renderPage(
          this.props.page,
          this.canvasRef.current,
          this.props.scale,
          () => {
            // callback function that is executed after rendering is done
            // Set working state to false.
            this.setState({ working: false });

            // if tempCanvas exists, remove it after 100ms.
            window.setTimeout(() => {
              if (tempCanvas) {
                tempCanvas.parentNode.removeChild(tempCanvas);
              }
            }, 100);

            // If debug, print in console.debug
            if (this.props.debug) {
              const total = performance.now() - start;
              console.debug(
                `[react-pdfjs] Page ${
                  this.props.page.pageNumber
                } rendered in ${Math.round(total)}ms`
              );
            }
          }
        );
      });
    } else {
      if (isZooming) this.setupSizes();
    }
  }

  componentWillMount() {
    if (!this.props.display) return;
    this.setState({ working: true });

    this.setupSizes(() => {
      const start = performance.now();
      renderPage(
        this.props.page,
        this.canvasRef.current,
        this.props.scale,
        () => {
          if (this.props.debug) {
            const total = performance.now() - start;
            console.debug(
              `[react-pdfjs] Page ${
                this.props.page.pageNumber
              } rendered in ${Math.round(total)}ms`
            );
          }
        }
      );
    });
  }

  setupSizes = callback => {
    const { page, scale } = this.props;
    const canvas = this.canvasRef.current;
    const viewport = getViewport(page, scale, 0);
    let outputScale;
    if (canvas) {
      outputScale = getOutputScale(canvas.getContext("2d"));
    } else {
      outputScale = getOutputScale();
    }

    const sizes = {
      cssWidth: viewport.width,
      cssHeight: viewport.height,
      width: viewport.width * outputScale.sx,
      height: viewport.height * outputScale.sy
    };

    if (this.state.width === sizes.width) {
      if (typeof callback === "function") callback();
      return;
    }

    this.setState({ ...sizes }, () => {
      this.props.sizeChange(this.props.page.pageNumber);
      if (typeof callback === "function") callback();
    });
  };

  render() {
    const { display } = this.props;
    return (
      <div
        className="page"
        ref={this.containerRef}
        style={{ width: this.state.cssWidth, height: this.state.height }}
      >
        {display ? <canvas ref={this.canvasRef} /> : null}
      </div>
    );
  }
}
