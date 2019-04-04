import React from "react";
import Document from "./components/Document";
import getSettings from "./core/settings";
import "./styles.css";

const ReactPdfJs = props => {
  const settings = getSettings(props.settings);

  return <Document settings={settings} url={props.url} />;
};

export default ReactPdfJs;
