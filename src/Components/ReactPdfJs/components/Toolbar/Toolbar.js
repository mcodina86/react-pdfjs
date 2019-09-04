import React, { useState } from "react";
import { HiddenMenu, HiddenMenuItem } from "./components/HiddenMenu/";
import MenuButton from "./components/MenuButton";
import Icon from "./components/Icon";
import { Zoomin, Zoomout, Zoomreset, RotateCW, RotateCCW, ArrowLeft, ArrowRight } from "./icons/index";

const Toolbar = props => {
  const { name, page, total, goToPage, doZoom, rotate } = props;
  const [showMenu, setShowMenu] = useState(false);
  const iconSize = 0.6;

  return (
    <div className="toolbar">
      <div className="actions-mobile">
        <MenuButton action={() => setShowMenu(!showMenu)} expanded={showMenu} />
        {showMenu ? (
          <HiddenMenu>
            <HiddenMenuItem>
              <Icon action={() => rotate(true)}>
                <RotateCCW scale={iconSize} color="#ffffff" />
              </Icon>
            </HiddenMenuItem>

            <HiddenMenuItem>
              <Icon action={() => rotate()}>
                <RotateCW scale={iconSize} color="#ffffff" />
              </Icon>
            </HiddenMenuItem>

            <HiddenMenuItem>
              <Icon action={() => doZoom(-1)}>
                <Zoomout scale={iconSize} color="#ffffff" />
              </Icon>
            </HiddenMenuItem>

            <HiddenMenuItem>
              <Icon action={() => doZoom(0)}>
                <Zoomreset scale={iconSize} color="#ffffff" />
              </Icon>
            </HiddenMenuItem>

            <HiddenMenuItem>
              <Icon action={() => doZoom(1)}>
                <Zoomin scale={iconSize} color="#ffffff" />
              </Icon>
            </HiddenMenuItem>
          </HiddenMenu>
        ) : null}
      </div>
      <div className="info">{name}</div>
      <div className="pages">
        <Icon action={() => goToPage(true)}>
          <ArrowLeft scale={iconSize} color="#ffffff" />
        </Icon>
        <span className="separator" />
        {page} of {total}
        <span className="separator" />
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

        <span className="separator" />

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
