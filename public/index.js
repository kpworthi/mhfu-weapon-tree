import snsData from './sns-data.js';
import snsMap from './sns-map.js';
import NavBar from './navbar.js';

class Main extends React.Component {
  constructor() {
    super();
    this.state = {
      appTitle: "weapons",
      subTitle: "sword and shield",
      tagLine: "Hey, piece of shiny!",
      zoom: 32,
      oldZoom: 32,
      itemSelect: "",
      collapsedTrees: [],
      ctrlState: false
    };
    this.rowTicks = {};
    this.mouseDown = false;
    this.ctrlState = false;
    this.dragX = 0;
    this.dragY = 0;
    this.sharpColors = ["red", "ora", "yel", "gre", "blu", "whi"];

    this.changeState = stateObj => {
      this.setState(stateObj);
    };

    this.displayTree = this.displayTree.bind(this);
    this.buildPanelSharpness = this.buildPanelSharpness.bind(this);
    this.buttonHandler = this.buttonHandler.bind(this);
    this.dragHandler = this.dragHandler.bind(this);
    this.hoverHandler = this.hoverHandler.bind(this);
    this.keyHandler = this.keyHandler.bind(this);
    this.tooltipInfo = this.tooltipInfo.bind(this);
  }

  componentDidMount() {
    document.onkeydown = this.keyHandler;
    document.onkeyup = this.keyHandler;
  }

  displayTree() {
    const boxWidth = this.state.zoom;
    const oldWidth = this.state.oldZoom;
    const hLineLength = boxWidth * 1.5;
    const vLineLength = boxWidth / 5;
    const boxSpaceX = hLineLength + boxWidth;
    const boxSpaceY = vLineLength + boxWidth;
    const paddingX = 250;
    const paddingY = 10;
    const rarity = ["white", "#ececec", "#b2c06a", "#5f9757", "#83b1bc", "#6864b7", "#8867c4", "#b7846a", "#dc5052", "#8cb7e1"];
    let rightMax = 0; // track position of right-most element

    let bottomMax = 0; // track position of bottom-most element
    // modify grid based on currently collapsed trees

    let newGrid = snsMap;
    let collapsed = this.state.collapsedTrees.map(val => val.slice(0, -5));
    let rowFilter = [];
    let countFlag = false;
    newGrid.forEach((val, ind) => {
      if (collapsed.includes(val[0])) countFlag = true;else if (val[0] !== "" && val[0] !== "+") countFlag = false;else {
        if (countFlag) rowFilter.push(ind);
      }
    });
    newGrid = newGrid.filter((val, ind) => !rowFilter.includes(ind));
    let theTree = [];
    theTree.push( /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
      id: "myGradient",
      gradientTransform: "rotate(90)"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "5%",
      "stop-color": "gold"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "95%",
      "stop-color": "red"
    }))));
    newGrid.forEach((row, y) => {
      // determine row name
      let rowName = row[0];
      let currCollapsed = this.state.collapsedTrees;

      if (rowName !== "" && rowName !== "+") {
        theTree.push( /*#__PURE__*/React.createElement("text", {
          class: `title tree-title-${currCollapsed.includes(rowName + " Tree") ? 'closed' : 'open'}`,
          x: "5",
          y: paddingY + 5 + boxWidth / 2 + boxSpaceY * y,
          onClick: this.buttonHandler
        }, `${rowName} Tree`));
      } // calculate row horizontal line start/end


      let rowFirstItem = row.findIndex((cell, ind) => cell !== "");
      let rowLastItem = row.slice(rowFirstItem).findIndex((cell, ind, arr) => ind + 1 === arr.length || arr[ind + 1] === "") + rowFirstItem; // line paints from center of first item, unless it's a branch node
      // for branch nodes, it paints from the middle of the next cell over

      let lineX = 0;
      lineX = row[rowFirstItem] === "+" ? paddingX + boxWidth + hLineLength / 2 + boxSpaceX * rowFirstItem : paddingX + boxWidth / 2 + boxSpaceX * rowFirstItem;
      let lineMod = row[rowFirstItem] === "+" ? 1 : 0;
      theTree.push( /*#__PURE__*/React.createElement("rect", {
        id: `row-line-${y}`,
        class: "h-line",
        width: (rowLastItem - rowFirstItem) * boxWidth + (rowLastItem - rowFirstItem - lineMod) * hLineLength,
        height: "2",
        x: lineX,
        y: paddingY + boxWidth / 2 + boxSpaceY * y - 1,
        stroke: "black",
        fill: "black"
      })); // paint vertical lines and the item boxes

      row.forEach((cell, x) => {
        // calculate column line positions (only on first row iteration)
        if (y === 0) {
          let vPairs = []; // array for all the start/end points for each vertical line

          let column = []; // array for the current column

          newGrid.forEach(rowAgain => column.push(rowAgain[x]));

          if (column.indexOf("+") !== -1) {
            // make sure there's a "+"
            for (let i = 0; i < column.length; i++) {
              // iterate over each column item
              let cell = column[i];

              if (cell === "+") {
                // check to see if the current "+" is the last branch or not, then set it
                let cellLeft = column.slice(0, i);
                let cellRight = column.slice(i + 1);
                let continueFlag = false;
                if (i === column.length - 1) vPairs.push([0, i]); // if it's the last "+" in a column, set it
                else {
                    for (let j = 0; j < cellRight.length; j++) {
                      // iterate over every item to the right of the current cell
                      if (cellRight[j] === "+") {
                        continueFlag = true; // if it's another "+", it's not the last branch, check next item in column

                        break;
                      } else if (j === column.length - 1 || j !== "") {
                        vPairs.push([0, i]); // add the y-position of "+" to the vPair array

                        break; // break early if it wasn't the end of the column
                      }
                    }
                  }
                if (continueFlag) continue; // stop checking this column item if it was determined not the last branch

                for (let j = i - 1; j >= 0; j--) {
                  // iterate over every item to the left of the current cell
                  if (cellLeft[j] !== "+" && cellLeft[j] !== "") {
                    // not a "+" or empty space, must be the branch root
                    vPairs[vPairs.length - 1][0] = j; // modify the first val in last item in vPair to current index (y position)

                    break; // break early
                  }
                }
              }
            } // now paint the lines


            vPairs.forEach((vPair, ind) => {
              let colFirstItem = vPair[0];
              let colLastItem = vPair[1];
              theTree.push( /*#__PURE__*/React.createElement("rect", {
                id: `col-${x}-line-${ind + 1}`,
                class: "v-line",
                width: "2",
                height: (colLastItem - colFirstItem) * boxWidth + (colLastItem - colFirstItem) * vLineLength,
                x: paddingX + boxWidth + hLineLength / 2 + boxSpaceX * x,
                y: paddingY + boxWidth / 2 + boxSpaceY * colFirstItem,
                stroke: "black",
                fill: "black"
              }));
            });
          }
        } // paint the item boxes and paste relevant icons


        let weapon = snsData[snsData.findIndex(val => val.name === cell)];

        if (cell !== "" && cell !== "+") {
          // border
          theTree.push( /*#__PURE__*/React.createElement("rect", {
            id: `${cell}-border`,
            class: "icon-border",
            width: boxWidth,
            height: boxWidth,
            x: paddingX + boxSpaceX * x,
            y: paddingY + boxSpaceY * y,
            stroke: "black",
            fill: cell.includes("Dual Swords") ? "white" : rarity[weapon.rarity - 1]
          }));
          if (paddingX + boxSpaceX * x > rightMax) rightMax = paddingX + boxSpaceX * x;
          if (paddingY + boxSpaceY * y > bottomMax) bottomMax = paddingY + boxSpaceY * y; // weapon icon

          theTree.push( /*#__PURE__*/React.createElement("image", {
            id: cell,
            class: "icon",
            href: cell.includes("Dual Swords") ? "./public/icons/ds.png" : "./public/icons/sns.png",
            x: paddingX + boxSpaceX * x,
            y: paddingY + boxSpaceY * y,
            width: boxWidth,
            height: boxWidth,
            onTouchStart: this.buttonHandler,
            onTouchCancel: this.touchHandler,
            onTouchEnd: this.touchHandler,
            onMouseDown: this.buttonHandler,
            onClick: this.buttonHandler,
            onMouseOver: this.hoverHandler,
            onMouseLeave: this.exitHandler
          })); // element icon

          if (weapon !== undefined && weapon.attribute !== "N/A") {
            theTree.push( /*#__PURE__*/React.createElement("image", {
              id: cell + " attr",
              class: "icon",
              href: `./public/icons/${weapon.attribute.split(" ")[0].toLowerCase()}.png`,
              x: paddingX + 3 * boxWidth / 4 + boxSpaceX * x,
              y: paddingY + 5 * boxWidth / 8 + boxSpaceY * y,
              width: 5 * boxWidth / 8,
              height: 5 * boxWidth / 8,
              onMouseDown: this.buttonHandler
            }));
          } // create-able icon


          if (weapon !== undefined && weapon["create-cost"] !== "N/A" && x !== 0) {
            theTree.push( /*#__PURE__*/React.createElement("image", {
              id: cell + "-create",
              class: "icon",
              href: `./public/icons/create.png`,
              x: paddingX - 5 * boxWidth / 8 + boxSpaceX * x,
              y: paddingY + boxWidth / 8 + boxSpaceY * y,
              width: 3 * boxWidth / 4,
              height: 3 * boxWidth / 4,
              onMouseDown: this.buttonHandler
            }));
          }
        }
      });
    }); // set the height and width of the svg element based on lowest and right-most elements

    return /*#__PURE__*/React.createElement("svg", {
      width: rightMax + 2 * boxWidth,
      height: bottomMax + 2 * boxWidth,
      id: "the-tree"
    }, theTree);
  }

  dragHandler(event) {
    if (event.type === "mousedown") {
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.mouseDown = true;
    } else if (event.type === "mouseup") {
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.mouseDown = false;
    } else if (event.type === "mousemove") {
      if (this.mouseDown) {
        let wrapper = document.querySelector('#svg-overflow-wrapper');
        let diff = [this.dragX - event.clientX, this.dragY - event.clientY];
        wrapper.scrollLeft = wrapper.scrollLeft + diff[0];
        wrapper.scrollTop = wrapper.scrollTop + diff[1] * 2;
        this.dragX = event.clientX;
        this.dragY = event.clientY;
      }
    } else if (event.type === "mouseleave") {
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.mouseDown = false;
    }
  }

  buttonHandler(event) {
    if (event.type === "mousedown") {
      event.preventDefault();
    } // handle click on zoom buttons
    else if (event.target.id.startsWith("zoom")) {
        let zoom = this.state.zoom;

        if (event.target.id.includes("In")) {
          if (zoom < 40) this.setState({
            zoom: zoom + 8,
            oldZoom: zoom
          });
        } else {
          if (zoom > 16) this.setState({
            zoom: zoom - 8,
            oldZoom: zoom
          });
        }
      } // handle clicking on icons
      else if (event.target.className.baseVal === "icon" && !event.target.id.includes('Dual Swords')) {
          event.preventDefault();
          this.setState({
            itemSelect: snsData.find(val => val.name === event.target.id)
          });
          if (document.querySelector('.active-border')) document.querySelector('.active-border').classList.remove('active-border');
          document.getElementById(`${event.target.id}-border`).classList.add('active-border');
        } // handle collapsing of trees
        else if (event.target.classList.toString().includes("tree-title")) {
            event.preventDefault();
            let currCollapsed = this.state.collapsedTrees;
            let tree = event.target.textContent;

            if (currCollapsed.includes(tree)) {
              let treeInd = currCollapsed.findIndex(val => val === tree);
              currCollapsed = currCollapsed.slice(0, treeInd).concat(currCollapsed.slice(treeInd + 1));
              this.setState({
                collapsedTrees: currCollapsed
              });
            } else {
              this.setState({
                collapsedTrees: currCollapsed.concat(tree)
              });
            }
          }
  }

  keyHandler(event) {
    if (event.type === "keydown" && (event.code === "ControlLeft" || event.code === "ControlRight") && this.ctrlState == false) {
      this.setState({
        ctrlState: true
      }); //document.querySelectorAll('.compare').forEach( element => element.classList.add('show') );
    } else if (event.type === "keyup" && (event.code === "ControlLeft" || event.code === "ControlRight")) {
      this.setState({
        ctrlState: false
      }); //document.querySelectorAll('.compare').forEach( element => element.classList.remove('show') );
    }
  }

  touchHandler(event) {
    if (event.type == "touchend" || event.type == "touchstart") {
      event.preventDefault();
      this.buttonHandler(event);
    } else if (event.type = "touchcancel") {
      event.preventDefault();
    }
  }

  buildPanelSharpness() {
    let sharpness = [];
    let sharpString = this.state.itemSelect.sharpness;

    for (let i = 0; i < sharpString.length; i += 4) {
      sharpness.push(sharpString.slice(i, i + 4));
    }

    return sharpness.map(str => {
      return /*#__PURE__*/React.createElement("div", {
        class: `sharp-bar ${str[0].toLowerCase()} ${str.slice(1)}`
      });
    });
  }

  buildToolSharpness(sharpString) {
    let colors = this.sharpColors;
    let sharpness = [];

    for (let i = 0; i < sharpString.length; i += 4) {
      sharpness.push(sharpString.slice(i, i + 4));
    }

    for (let each of colors) {
      let tag = sharpness.find(val => each === val.slice(1));

      if (tag === undefined) {
        document.querySelector(`#tool-${each}-bar`).className = `n`;
      } else {
        document.querySelector(`#tool-${each}-bar`).className = `sharp-bar ${each} ${tag[0].toLowerCase()}`;
      }
    }
  }

  hoverHandler(event) {
    let tooltip = document.querySelector("#tooltip");
    let htmlEl = document.querySelector("html");
    let mouseLoc = [event.pageX, event.pageY];
    let weapon = snsData[snsData.findIndex(val => val.name === event.target.id)];
    if (weapon === undefined) weapon = {
      name: event.target.id,
      attack: '*',
      attribute: '*',
      sharpness: '*'
    };
    document.querySelector("#tool-name").textContent = weapon.name;
    document.querySelector("#tool-attack").textContent = weapon.attack;
    document.querySelector("#tool-element").textContent = weapon.attribute;
    this.buildToolSharpness(weapon.sharpness); //document.querySelector("#tool-sharp").textContent = weapon.sharpness;

    tooltip.style.opacity = 1;
    let projectedDiff = tooltip.offsetHeight + mouseLoc[1] - (htmlEl.offsetHeight + htmlEl.scrollTop);
    tooltip.style.top = `${mouseLoc[1] + 10 - (projectedDiff > 0 ? projectedDiff + 10 : 0)}px`;
    tooltip.style.left = `${mouseLoc[0]}px`;
  }

  exitHandler(event) {
    let tooltip = document.querySelector("#tooltip");
    tooltip.style.opacity = 0;
    tooltip.style.left = `-300px`;
    tooltip.style.top = `-300px`;
  }

  tooltipInfo(type) {
    let selected = this.state.itemSelect;
    let compare = this.state.ctrlState;
    return /*#__PURE__*/React.createElement("table", {
      id: "tooltip",
      class: "tooltip"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
      id: "tool-name",
      colspan: "2"
    }), /*#__PURE__*/React.createElement("th", {
      id: "compare-name",
      colspan: "1"
    }, compare ? selected.name : null))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, "Attack")), /*#__PURE__*/React.createElement("td", {
      id: "tool-attack"
    }), /*#__PURE__*/React.createElement("td", {
      id: "compare-attack",
      class: "pl-2"
    }, compare ? selected.attack : null)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, "Element")), /*#__PURE__*/React.createElement("td", {
      id: "tool-element"
    }), /*#__PURE__*/React.createElement("td", {
      id: "compare-element",
      class: "pl-2"
    }, compare ? selected.attribute : null)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, "Sharpness")), /*#__PURE__*/React.createElement("td", {
      id: "tool-sharp"
    }, this.sharpColors.map(val => /*#__PURE__*/React.createElement("div", {
      id: `tool-${val}-bar`
    })))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null), /*#__PURE__*/React.createElement("td", {
      id: "compare-sharp"
    }, compare && selected ? this.buildPanelSharpness() : null))));
  }

  render() {
    let selectedWeapon = this.state.itemSelect;
    let title = this.state.appTitle;
    let subTitle = this.state.subTitle;
    return /*#__PURE__*/React.createElement("div", {
      id: "app-wrapper",
      class: "container-fluid d-flex flex-column"
    }, /*#__PURE__*/React.createElement(NavBar, {
      title: this.state.appTitle,
      subTitle: this.state.subTitle,
      tagLine: this.state.tagLine,
      changeState: this.changeState
    }), /*#__PURE__*/React.createElement("div", {
      id: "main-app-row",
      class: "row m-0"
    }, /*#__PURE__*/React.createElement("div", {
      id: "zoomInBtn",
      onClick: this.buttonHandler
    }, "+"), /*#__PURE__*/React.createElement("div", {
      id: "zoomOutBtn",
      onClick: this.buttonHandler
    }, "-"), /*#__PURE__*/React.createElement("div", {
      id: "svg-overflow-wrapper",
      class: "col-sm-8 col-lg-9",
      onMouseLeave: this.dragHandler,
      onMouseDown: this.dragHandler,
      onMouseUp: this.dragHandler,
      onMouseMove: this.dragHandler
    }, this.displayTree()), /*#__PURE__*/React.createElement("div", {
      id: "info-panel",
      class: "pt-1 pb-3 col-sm-4 col-lg-3"
    }, /*#__PURE__*/React.createElement("h2", {
      class: "title"
    }, "Info Panel"), selectedWeapon === "" ? null : /*#__PURE__*/React.createElement("table", {
      id: "panel-main-table",
      class: "panel-main-table ml-2"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, " ", /*#__PURE__*/React.createElement("th", {
      id: "panel-name",
      class: "text-center",
      colspan: "2"
    }, selectedWeapon.name), " ")), /*#__PURE__*/React.createElement("tbody", null, Object.keys(selectedWeapon).slice(1, 8).map(key => {
      let title = key.split('');
      title[0] = title[0].toUpperCase();
      title = title.join('');
      return /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
        class: "px-1"
      }, /*#__PURE__*/React.createElement("b", null, title == "Bonus" ? "Defense Bonus" : title)), /*#__PURE__*/React.createElement("td", {
        id: `panel-${key}`,
        class: "px-1"
      }, key == "sharpness" ? this.buildPanelSharpness() : selectedWeapon[key]));
    }))), selectedWeapon === "" ? null : /*#__PURE__*/React.createElement("table", {
      id: "panel-create-table",
      class: "panel-create-table ml-2"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
      id: "panel-name",
      class: "text-center",
      colspan: "2"
    }, "From Scratch"))), /*#__PURE__*/React.createElement("tbody", null, selectedWeapon["create-cost"] !== "N/A" ? Object.keys(selectedWeapon).filter(val => val.startsWith('create')).map(key => {
      let title = key.split('');
      title[0] = title[0].toUpperCase();
      title = title.join('').split('-').join(' ');
      return /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
        class: "px-1"
      }, /*#__PURE__*/React.createElement("b", null, title)), typeof selectedWeapon[key] === "object" ? /*#__PURE__*/React.createElement("td", {
        id: `panel-${key}`,
        class: "px-1"
      }, selectedWeapon[key].map(val => /*#__PURE__*/React.createElement("p", {
        class: "m-0 p-0"
      }, val))) : /*#__PURE__*/React.createElement("td", {
        id: `panel-${key}`,
        class: "px-1"
      }, selectedWeapon[key]));
    }) : /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
      class: "cell-type-unavail"
    }, "This weapon cannot be created from scratch.")))), selectedWeapon === "" ? null : /*#__PURE__*/React.createElement("table", {
      id: "panel-upgrade-table",
      class: "panel-upgrade-table ml-2 mb-3"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
      id: "panel-name",
      class: "text-center",
      colspan: "2"
    }, "Upgrade"))), /*#__PURE__*/React.createElement("tbody", null, selectedWeapon["upgrade-cost"] !== "N/A" ? Object.keys(selectedWeapon).filter(val => val.startsWith('upgrade')).map(key => {
      let title = key.split('');
      title[0] = title[0].toUpperCase();
      title = title.join('').split('-').join(' ');
      return /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
        class: "px-1"
      }, /*#__PURE__*/React.createElement("b", null, title)), typeof selectedWeapon[key] === "object" ? /*#__PURE__*/React.createElement("td", {
        id: `panel-${key}`,
        class: "px-1"
      }, selectedWeapon[key].map(val => /*#__PURE__*/React.createElement("p", {
        class: "m-0 p-0"
      }, val))) : /*#__PURE__*/React.createElement("td", {
        id: `panel-${key}`,
        class: "px-1"
      }, selectedWeapon[key]));
    }) : /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
      class: "cell-type-unavail"
    }, "This weapon cannot be upgraded into.")))))), this.tooltipInfo());
  }

}

ReactDOM.render( /*#__PURE__*/React.createElement(Main, null), document.querySelector("body"));