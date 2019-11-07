import React from "react";
import ReactPDF from "../react-pdf";
import { App } from "./app.module.scss";

export default () => {
  return (
    <div className={App}>
      <ReactPDF></ReactPDF>
    </div>
  );
};
