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
      width: this.props.width,
      height: this.props.height,
      scale: this.props.scale,
      isRendering: false
    };
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps !== this.props) {
      return true;
    }

    return false;
  }

  componentDidUpdate() {
    // Check if zoom is applied.
    let isZooming = this.state.scale !== this.props.scale;
    // First we check that the page should be rendered
    if (this.props.display === true) {
      // First, setup elements sizes
      this.setupSizes(() => {
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

        this.doRender(() => {
          window.setTimeout(() => {
            if (tempCanvas) {
              tempCanvas.parentNode.removeChild(tempCanvas);
            }
          }, 100);
        });
      });
    } else {
      if (isZooming) this.setupSizes();
    }
  }

  componentWillMount() {
    this.setupSizes(() => {
      if (this.props.display) {
        this.doRender();
      }
    });
  }

  doRender = callback => {
    if (this.state.isRendering) return;

    this.setState({ isRendering: true });

    const start = performance.now();

    renderPage(this.props.obj, this.canvasRef.current, this.props.scale, () => {
      this.setState({ isRendering: false });
      if (this.props.debug) {
        const total = performance.now() - start;
        console.debug(
          `[react-pdfjs] Page ${this.props.number} rendered in ${Math.round(
            total
          )}ms`
        );
      }
      if (callback) callback();
    });
  };

  setupSizes = callback => {
    if (this.state.isRendering) {
      callback();
      return;
    }

    const { obj, scale } = this.props;
    const canvas = this.canvasRef.current;
    const viewport = getViewport(obj, scale, 0);
    let outputScale;
    if (canvas) {
      outputScale = getOutputScale(canvas.getContext("2d"));
    } else {
      outputScale = getOutputScale();
    }

    const sizes = {
      width: viewport.width,
      height: viewport.height,
      outputScale: outputScale
    };

    if (this.state.width === sizes.width) {
      if (typeof callback === "function") callback();
      return;
    }

    this.setState({ ...sizes }, () => {
      if (this.props.sizeChange) {
        this.props.sizeChange(this.props.page.pageNumber);
      }

      if (typeof callback === "function") callback();
    });
  };

  render() {
    const { display } = this.props;
    const { width, height, outputScale } = this.state;

    const style = {
      width: this.state.width,
      height: this.state.height
    };

    const sizes = {
      width: width * outputScale.sx,
      height: height * outputScale.sy
    };

    return (
      <div className="page" ref={this.containerRef} style={style}>
        {display ? <canvas ref={this.canvasRef} {...sizes} /> : null}
      </div>
    );
  }
}
