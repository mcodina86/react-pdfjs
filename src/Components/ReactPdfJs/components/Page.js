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

  /**
   * Check if zoom (scaleChanged), display (displayChanged)
   * or rotation (rotationChanged) occurs.
   *
   * @param {{}} prevProps
   */
  componentDidUpdate(prevProps) {
    const scaleChanged = this.props.scale !== prevProps.scale;
    const displayChanged = this.props.display !== prevProps.display;
    const rotationChanged = this.props.rotation !== prevProps.rotation;

    if (displayChanged) {
      // if display props changed
      if (this.props.display) {
        // if now is true
        this.doRender(); // render the page
      } else {
        // if it's false
        if (this.props.settings.cleanMemory) this.props.obj.cleanup(); // clean the memory
      }
    } else {
      // if display props didn't change
      if (scaleChanged) {
        // If the thing that changed is the zoom
        this.onScaleChange(); // Just update sizes and re render
      } else if (rotationChanged) {
        // If is the rotation the one who changed
        this.onRotationChange(); // Just apply the rotation
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

  /**
   * What the page should do when the zoom is changed
   */
  onScaleChange = () => {
    let tempCanvas;
    if (this.props.display) {
      // Create temporal canvas is the page is already rendered
      tempCanvas = this.createTempCanvas();
    }

    this.setupSizes(() => {
      if (this.props.sizeChange && this.props.number === 1)
        this.props.sizeChange();
      if (this.props.display) {
        this.doRender(() => {
          // after rendering the page remove temporal canvas if exists
          window.setTimeout(() => {
            if (tempCanvas) {
              tempCanvas.parentNode.removeChild(tempCanvas);
            }
          }, 100);
        });
      }
    });
  };

  /**
   * What the page should do when the rotation is changed
   */
  onRotationChange = () => {
    this.setupSizes(() => {
      if (this.props.display) {
        this.doRender();
      }
    });
  };

  /**
   * Function that is called every time that we need
   * render the page
   *
   * @param {function} callback
   */
  doRender = callback => {
    if (this.state.isRendering) return;

    this.setState({ isRendering: true });

    const start = startDebug();
    const { obj, scale, rotation, settings, number } = this.props;

    renderPage(obj, this.canvasRef.current, scale, rotation, () => {
      this.setState({ isRendering: false });

      if (settings.debug) {
        endDebug(start, `Rendering page ${number}`);
      }
      if (callback) callback();
    });
  };

  /**
   * Function for creating temporal canvas using the current one as
   * source
   */
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

  /**
   * Change the size of the current elements.
   */
  setupSizes = callback => {
    // If it's already rendering, just executes the callback function if exists
    if (this.state.isRendering) {
      callback();
      return;
    }

    const { obj, scale, rotation } = this.props;
    const canvas = this.canvasRef.current;
    const viewport = obj.getViewport(scale, rotation);
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

    // If the size doesn't changed, executes the callback and ends the function
    if (this.state.width === sizes.width) {
      if (typeof callback === "function") callback();
      return;
    }

    this.setState({ ...sizes }, () => {
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
        {display ? (
          <canvas ref={this.canvasRef} {...sizes} style={style} />
        ) : null}
      </div>
    );
  }
}
