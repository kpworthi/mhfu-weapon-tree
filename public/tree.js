const Tree = ({
  weaponMap,
  weaponData,
  zoom,
  oldZoom,
  collapsedTrees
}) => {
  const boxWidth = zoom;
  const oldWidth = oldZoom;
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

  let newGrid = weaponMap;
  let collapsed = collapsedTrees.map(val => val.slice(0, -5));
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
    let currCollapsed = collapsedTrees;

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


      let weapon = weaponData[weaponData.findIndex(val => val.name === cell)];

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
};

export default Tree;