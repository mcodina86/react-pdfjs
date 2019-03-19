import React from "react";
import { getOutputScale } from "../utils/ui_utils";
import "./Page.css";

export default class Page extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  state = {
    rendering: false,
    display: this.props.page.display,
    sizes: {
      width: 0,
      height: 0,
      cssWidth: this.props.page.sizes.width,
      cssHeight: this.props.page.sizes.height
    }
  };

  componentDidMount() {
    let { display } = this.state;
    if (display) this.doRender();
  }

  componentWillUpdate() {
    let { page } = this.props;
    let { display } = this.state;
    if (page.display !== display) {
      this.setState({ display: page.display });
      if (page.display) {
        this.doRender();
      }
    }
  }

  doRender = () => {
    const canvas = this.canvasRef.current;
    if (!canvas) return;

    let { rendering } = this.state;
    const { settings, page } = this.props;
    const obj = page.obj;

    // Checking page isn't rendering before start doing it
    if (rendering) return;
    this.setState({ rendering: true });

    let canvasContext = canvas.getContext("2d");
    let outputScale = getOutputScale(canvasContext);
    let viewport = obj.getViewport(settings.currentScale, settings.rotation);
    // Set sizes:
    var sizes = {
      width: viewport.width * outputScale.sx,
      height: viewport.height * outputScale.sy,
      cssWidth: viewport.width,
      cssHeight: viewport.height
    };
    this.setState({ sizes });

    let transform = !outputScale.scaled
      ? null
      : [outputScale.sx, 0, 0, outputScale.sy, 0, 0];

    let renderContext = { canvasContext, viewport, transform };

    // Start rendering
    obj
      .render(renderContext)
      .then(() => {
        console.log("Page rendered");
      })
      .catch(error => {
        console.log(error);
      });
  };

  render() {
    const { page, number } = this.props;
    const { width, cssWidth, height, cssHeight } = this.state.sizes;
    const sizes = { width: cssWidth, height: cssHeight };
    return (
      <div className={`page page-${number}`} style={sizes}>
        {page.display ? (
          <canvas
            className={`canvas-page-${number}`}
            ref={this.canvasRef}
            width={width}
            height={height}
            style={sizes}
          />
        ) : null}
      </div>
    );
  }
}
