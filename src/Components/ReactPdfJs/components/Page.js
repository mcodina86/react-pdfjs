import React from "react";
import { getViewport, renderPage } from "../core/pdfjs-functions";
import { getOutputScale } from "../utils/ui_utils";
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

    if (nextProps.display && nextProps.scale !== this.props.scale) {
      return true;
    }

    if (nextState.width !== this.state.width) {
      return true;
    }

    return false;
  }

  componentDidUpdate() {
    if (this.props.display === true) {
      if (this.state.working) return;
      let isZooming = this.state.scale !== this.props.scale;
      this.setState({ working: true });
      // Is doing zoo
      this.setupSizes(isZooming, () => {
        const start = performance.now();
        this.setState({ working: true });
        if (isZooming) {
          this.createTempCanvas();
        }
        renderPage(
          this.props.page,
          this.canvasRef.current,
          this.props.scale,
          () => {
            this.setState({ working: false });
            this.removeTempCanvas();
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
  }

  createTempCanvas = () => {
    let newCanvas = document.createElement("canvas");
    let newCanvasContext = newCanvas.getContext("2d");
    newCanvas.width = this.state.width;
    newCanvas.height = this.state.height;
    newCanvas.style.width = this.state.cssWidth;
    newCanvas.style.height = this.state.height;
    newCanvas.className = "tempCanvas";
    newCanvasContext.drawImage(this.canvasRef.current, 0, 0);
    let page = this.containerRef.current;
    page.appendChild(newCanvas);
  };

  removeTempCanvas = () => {
    let page = this.containerRef.current;
    let tempCanvas = page.getElementsByClassName("tempCanvas")[0];
    if (tempCanvas) page.removeChild(tempCanvas);
  };

  componentWillMount() {
    if (!this.props.display) return;
    this.setupSizes(false, () => {
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

  setupSizes = (isZooming, callback) => {
    console.log("Setup sizes");
    const { page, scale } = this.props;
    const canvas = this.canvasRef.current;
    const viewport = getViewport(page, scale, 0);
    const outputScale = getOutputScale(canvas.getContext("2d"));
    this.setState(
      {
        cssWidth: viewport.width,
        cssHeight: viewport.height,
        width: viewport.width * outputScale.sx,
        height: viewport.height * outputScale.sy
      },
      () => {
        if (isZooming) {
          /* const tempCanvas = this.tempCanvasRef.current;
          const newCanvasContext = tempCanvas.getContext("2d");
          newCanvasContext.drawImage(this.canvasRef.current, 0, 0);
          tempCanvas.style.width = this.state.cssWidth + "px";
          tempCanvas.style.height = this.state.cssHeight + "px";
          tempCanvas.width = this.state.width;
          tempCanvas.height = this.state.height; */
        }
        if (typeof callback === "function") callback();
      }
    );
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
