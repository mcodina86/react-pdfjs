import React from "react";
import { getViewport, renderPage } from "../core/pdfjs-functions";
import { getOutputScale } from "../utils/ui_utils";
import "./Page.css";

export default class Page extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {
      firstRendering: true,
      width: this.props.width,
      height: this.props.height,
      cssWidth: this.props.width,
      cssHeight: this.props.height
    };
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.display !== this.props.display) {
      return true;
    }

    if (nextProps.display && nextProps.scale !== this.props.scale) {
      return true;
    }

    return false;
  }

  componentDidUpdate() {
    if (this.props.display === true) {
      this.setupSizes(() => {
        renderPage(this.props.page, this.canvasRef.current, this.props.scale);
      });
    }
  }

  componentWillMount() {
    if (!this.props.display) return;
    this.setupSizes(() => {
      renderPage(this.props.page, this.canvasRef.current, this.props.scale);
    });
  }

  setupSizes = callback => {
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
        if (typeof callback === "function") callback();
      }
    );
  };

  render() {
    const { display } = this.props;
    return <div>{display ? <canvas ref={this.canvasRef} /> : null}</div>;
  }
}
