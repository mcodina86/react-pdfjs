import React from "react";
import Toolbar from "./components/toolbar";
import PdfContext from "./context/pdf-context";
import { Component } from "./react-pdf.module.scss";
import pdfjs from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default props => {
  /* const url = props.url || `${process.env.PUBLIC_URL}/assets/example/cuentos.pdf`;
  console.log(url); 

  const file = pdfjs.getDocument(url);

  console.log(file); */

  return (
    <PdfContext.Provider>
      <div className={Component}>
        <Toolbar></Toolbar>
      </div>
    </PdfContext.Provider>
  );
};
