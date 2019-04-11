import React from "react";
import HiddenMenu from "./HiddenMenu";
import HiddenMenuItem from "./HiddenMenuItem";
import MenuButton from "./MenuButton";
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

export default class Toolbar extends React.PureComponent {
  state = { showMenu: false, iconSize: 0.6 };

  render() {
    const { name, page, total, goToPage, doZoom, rotate } = this.props;
    let { iconSize } = this.state;

    return (
      <div className="toolbar">
        <div className="actions-mobile">
          <MenuButton
            action={() => this.setState({ showMenu: !this.state.showMenu })}
            expanded={this.state.showMenu}
          />
          {this.state.showMenu ? (
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
  }
}

/*

const Toolbar = props => {
  var { name, page, total, goToPage, doZoom, rotate } = props;
  const iconSize = "0.6";
  let showMenu = false;
  return (
    <div className="toolbar">
      <div className="actions-mobile">
        <button onClick={() => (showMenu = true)}>M</button>
        {showMenu ? (
          <HiddenMenu>
            <li>Hola</li>
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
*/
