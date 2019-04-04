import React from "react";
import { renderPage } from "../core/pdfjs-functions";
import { getOutputScale, buildCanvas } from "../utils/ui_utils";
import { startDebug, endDebug } from "../utils/debugger";
import "./Page.css";

export default class Page extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.containerRef = React.createRef();

    this.state = {
      scale: this.props.scale,
      isRendering: false
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.display !== this.props.display) {
      if (this.props.display) {
        this.doRender();
      }
    } else {
      if (this.props.scale !== prevProps.scale) {
        let tempCanvas;
        if (this.props.display) {
          tempCanvas = this.createTempCanvas();
        }
        this.setupSizes(() => {
          if (this.props.display) {
            this.doRender(() => {
              window.setTimeout(() => {
                if (tempCanvas) {
                  tempCanvas.parentNode.removeChild(tempCanvas);
                }
              }, 100);
            });
          }
        });
      }
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

    const start = startDebug();

    renderPage(this.props.obj, this.canvasRef.current, this.props.scale, () => {
      this.setState({ isRendering: false });
      if (this.props.debug) {
        endDebug(start, `Rendering page ${this.props.number}`);
      }
      if (callback) callback();
    });
  };

  createTempCanvas = () => {
    const { width, height, cssWidth, cssHeight } = this.state;
    let tempCanvas = buildCanvas(
      "tempCanvas",
      { width, height, cssWidth, cssHeight },
      this.containerRef.current,
      this.canvasRef.current
    );

    return tempCanvas;
  };

  setupSizes = callback => {
    if (this.state.isRendering) {
      callback();
      return;
    }

    const { obj, scale } = this.props;
    const canvas = this.canvasRef.current;
    const viewport = obj.getViewport(scale, 0);
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
