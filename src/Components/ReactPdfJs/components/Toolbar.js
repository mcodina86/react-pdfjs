import React from "react";
import Icon from "./Icon";
import {
  Zoomin,
  Zoomout,
  Zoomreset,
  RotateCW,
  RotateCCW,
  ArrowLeft,
  ArrowRight
} from "../assets/icons/index";
import "./Toolbar.css";

const Toolbar = props => {
  var { name, page, total, goToPage, doZoom, rotate } = props;
  const iconSize = "0.6";
  return (
    <div className="toolbar">
      <div className="info">{name}</div>
      <div className="pages">
        <Icon action={() => goToPage(true)}>
          <ArrowLeft scale={iconSize} color="#ffffff" />
        </Icon>
        <span class="separator" />
        {page} of {total}
        <span class="separator" />
        <Icon action={() => goToPage()}>
          <ArrowRight scale={iconSize} color="#ffffff" />
        </Icon>
      </div>
      <div className="actions">
        <Icon action={() => rotate(true)}>
          <RotateCCW scale={iconSize} color="#ffffff" />
        </Icon>

        <Icon action={() => rotate()}>
          <RotateCW scale={iconSize} color="#ffffff" />
        </Icon>

        <span class="separator" />

        <Icon action={() => doZoom(-1)}>
          <Zoomout scale={iconSize} color="#ffffff" />
        </Icon>

        <Icon action={() => doZoom(0)}>
          <Zoomreset scale={iconSize} color="#ffffff" />
        </Icon>

        <Icon action={() => doZoom(1)}>
          <Zoomin scale={iconSize} color="#ffffff" />
        </Icon>
      </div>
    </div>
  );
};

export default Toolbar;
