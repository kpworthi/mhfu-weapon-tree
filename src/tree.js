import React from 'react';

const Tree = React.memo(({changeState, zoom, oldZoom, currInfo, altInfo, currWeapon, collapsedTrees}) => {

  const clickHandler = ( event ) => {
    // handle clicking on current tree's icons
    if ( event.target.id.startsWith(`${currInfo.abbr}icon`) ) {
      btnTreeIcon( event.target.dataset.weapon, `border-${event.target.id.split('-')[1]}` );
    }
    // handle clicking on alternate tree's icons
    else if ( event.target.id.startsWith(`${currInfo.alt}icon`) ) {
      btnTreeAltIcon( event.target.dataset.weapon.split(' (')[0], event.target.id.split('-')[1] );
    }
    // handle collapsing of trees
    else if ( event.target.textContent.endsWith('Tree') ) {
      btnTreeCollapse( event.target.textContent )
    }
  }

  const btnTreeIcon = ( weaponName ) => {
    changeState({
      itemSelect: currInfo.data.find( val => val.name === weaponName )
    })
  }

  const btnTreeAltIcon = ( weaponName ) => {
    const weaponTypeFull = currInfo.altFull.toLowerCase();
    const newWeapon = altInfo.data.find( val => val.name === weaponName );

    const scrollTo = ( newBorder ) => {
      let newScrollHeight = Math.floor(newBorder.y.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetHeight/2;
      document.querySelector('#svg-overflow-wrapper').scrollTop = newScrollHeight;
      let newScrollWidth = Math.floor(newBorder.x.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetWidth/2;
      document.querySelector('#svg-overflow-wrapper').scrollLeft = newScrollWidth;
    }

    changeState({
      subTitle: weaponTypeFull,
      itemSelect: newWeapon
    }, ()=>{
      
      // find the new border and move scrollbars to it
      let weapon = newWeapon;
      let newBorder = Array.from(document.querySelectorAll('.icon-border')).find( ele => ele.dataset.weapon === weapon.name );
      if ( !newBorder ) { // weapon is likely in a collapsed tree, collapse trees, reassign new border, then proceed
        changeState( {collapsedTrees: []}, () => {
          newBorder = Array.from(document.querySelectorAll('.icon-border')).find( ele => ele.dataset.weapon === weapon.name );
          scrollTo(newBorder);
        })
      }
      else { // weapon is likely not in a collapsed tree. proceed normally
        scrollTo(newBorder);
      }
      
      let tooltip = document.querySelector("#tooltip");
      tooltip.style.opacity = 0;
      tooltip.style.left = `-300px`;
      tooltip.style.top = `-300px`;
    });
  }

  const btnTreeCollapse = ( textContent ) => {
    let tree = textContent;
    if ( collapsedTrees.includes(tree) ){
      let treeInd = collapsedTrees.findIndex( val => val === tree );
      changeState({
        collapsedTrees: collapsedTrees.slice(0,treeInd).concat(collapsedTrees.slice(treeInd+1))
      });
    }
    else {
      changeState({
        collapsedTrees: collapsedTrees.concat(tree)
      });
    }
  }

  const exitHandler = (event) => {
    let tooltip = document.querySelector("#tooltip");
    tooltip.style.opacity = 0;
    tooltip.style.left = `-300px`;
    tooltip.style.top = `-300px`;
  }

  const hoverHandler = ( event ) => {
    let tooltip = document.querySelector("#tooltip");
    let htmlEl = document.querySelector("html");
    let mouseLoc = [event.pageX, event.pageY];  
    let weapon = currInfo.data.find( val=>val.name===event.target.dataset.weapon );
    if (weapon === undefined) weapon = altInfo.data.find( val=>val.name===event.target.dataset.weapon.split(' (')[0] );

    tooltip.style.opacity = 1;
    changeState({ itemHover: weapon })

    //prevent tooltip from going out of bounds
    let projectedDiffY = (tooltip.offsetHeight + mouseLoc[1]) - (htmlEl.offsetHeight + htmlEl.scrollTop);
    let projectedDiffX = (tooltip.offsetWidth + mouseLoc[0]) - (htmlEl.offsetWidth + htmlEl.scrollLeft);    
    tooltip.style.top = `${mouseLoc[1]+10-(projectedDiffY>0?projectedDiffY+10:0)}px`;
    tooltip.style.left = `${mouseLoc[0]-(projectedDiffX>0?projectedDiffX:0)}px`;
  }
  
  const touchHandler = (event) => {
    if (event.type == "touchend" || event.type == "touchstart" ) {
      event.preventDefault();
      clickHandler(event)
    }
    else if (event.type ="touchcancel" ) {
      event.preventDefault();
    }
  }

  const boxWidth = zoom;
  const oldWidth = oldZoom;
  const hLineLength = boxWidth*1.5;
  const vLineLength = boxWidth/5;
  const boxSpaceX = hLineLength + boxWidth;
  const boxSpaceY = vLineLength + boxWidth;
  const paddingX = 250;
  const paddingY = 10;
  const rarity = ["white","#ececec","#b2c06a","#5f9757","#83b1bc","#6864b7","#8867c4","#b7846a","#dc5052","#8cb7e1"];
  let rightMax = 0; // track position of right-most element
  let bottomMax = 0; // track position of bottom-most element
  const currMap = currInfo.map;
  const currData = currInfo.data;
  
  // modify grid based on currently collapsed trees
  let newGrid = currMap;
  let collapsed = collapsedTrees.map( val => val.slice(0,-5)); // remove ' Tree' from names
  let rowFilter = [];
  let countFlag = false;
  newGrid.forEach( (row,ind) => {
    if( collapsed.includes(row[0]) ) countFlag = true;             // this is a tree that is collapsed, flag it 
    else if ( collapsed.includes(row[1]) ) countFlag = true;       // this is a tree that starts from an alt weapon
    else if ( row[0] !== "" && row[0] !== "+" ) countFlag = false; // this is not a tree that is collapsed, unflag it
    else {  // this is a row that comes after a potentially flagged tree-row
      if( countFlag ) {
        rowFilter.push(ind); // it's flagged, add this row to the list of those that need to be removed
      }
    }
  });
  newGrid = newGrid.filter( (val,ind) => !rowFilter.includes(ind) );

  let theTree = [];
  for ( let i = 0; i<newGrid.length; i++ ) {
    const row = newGrid[i];
    const y   = i;
    // determine row name
    let rowName = row[0];
    if ( currInfo.alt && rowName.includes(currInfo.alt) ) rowName = row[1];
    if ( rowName !== "" && rowName !== "+" ) {
      theTree.push(
        <text className={`title tree-title-${collapsedTrees.includes(rowName+" Tree")?'closed':'open'}`}
              key={`title${y}`}
              x="5" 
              y={paddingY+5+boxWidth/2+boxSpaceY*y} 
              onClick={clickHandler}>
                {`${rowName} Tree`}
        </text>
      );
    }    

    // calculate row horizontal line start/end
    const rowFirstItem = row.findIndex( (cell, ind ) => cell !== "");
    const rowLastItem  = row.slice(rowFirstItem)
                            .findIndex( (cell, ind, arr ) => ind+1 === arr.length || arr[ind+1] === "") + rowFirstItem;

    // line paints from center of first item, unless it's a branch node
    // for branch nodes, it paints from the middle of the next cell over
    const startX = row[rowFirstItem] === "+"?(paddingX+boxWidth+hLineLength/2)+boxSpaceX*rowFirstItem:
                                             (paddingX+boxWidth/2)+boxSpaceX*rowFirstItem;
    const startY = (paddingY+boxWidth/2)+boxSpaceY*y;
    const lineMod = row[rowFirstItem] === "+"?1:0;
    const stopX  = startX + (rowLastItem-rowFirstItem)*boxWidth + (rowLastItem-rowFirstItem-lineMod)*hLineLength;

    theTree.push(
      <line id={`row-line-${y}`} 
            key={`row-line-${y}`}
            className="h-line"
            x1={startX}
            x2={stopX}
            y1={startY} 
            y2={startY}
            stroke="black"
            strokeWidth="2"
      />);

    // paint vertical lines and the item boxes
    for ( let j = 0; j<row.length; j++ ) {
      const cell = row[j];
      const x    = j;
      // calculate column line positions (only on first row iteration)
      // vertical lines go from the space between two icons until the final "+" (branch)
      // is reached for that item
      if ( y === 0 ) {
        let vPairs = []; // array for all the start/end points for each vertical line
        const column = newGrid.map((row) => row[x]); // array for the current column
        if ( column.indexOf("+") !== -1 ) { // make sure there's a "+"
          for (let k=0; k<column.length; k++) { // iterate over each column item
            const cell = column[k];
            if (cell === "+") { // check to see if the current "+" is the last branch or not, then set it
              let cellsLeft = column.slice(0,k);
              let cellsRight = column.slice(k+1);
              const rightCell = cellsRight.find((cell) => cell !== "");

              if (rightCell === "+") {
                // stop checking this column item if it was determined not to be the last branch
                continue;
              }

              for ( let jj=k-1; jj >= 0; jj-- ) { // iterate over every item to the left of the current cell
                if ( cellsLeft[jj] !== "+" && cellsLeft[jj] !== "" ) { // not a "+" or empty space, must be the branch root
                  vPairs.push([jj, k]);
                  break; // break early
                }
              }
            }
          }
          // now paint the lines
          vPairs.forEach( (vPair, ind) => {
            let colFirstItem = vPair[0];
            let colLastItem = vPair[1];
            let startX = (paddingX+boxWidth+hLineLength/2)+boxSpaceX*x;
            let startY = (paddingY+boxWidth/2)+boxSpaceY*colFirstItem;
            let stopY  = (startY + (colLastItem-colFirstItem)*boxWidth + (colLastItem-colFirstItem)*vLineLength);
            theTree.push(
              <line id={`col-${x}-line-${ind+1}`} 
                    className="v-line"
                    x1={startX}
                    x2={startX}
                    y1={startY}
                    y2={stopY} 
                    stroke="black" 
                    strokeWidth="2"
              />);
          });
        }
      }
    
      // paint the item boxes and paste relevant icons
      let weapon  = currData.find(val=>val.name===cell);
      let itemMod = `x${x}y${y}` // unique identifier for each border & icon
      let curAbbr = currInfo.abbr;
      let altAbbr = currInfo.alt;
      if (cell !== "" && cell !== "+") {
        // border
        theTree.push(
          <rect id={`border-${itemMod}`} 
                className="icon-border"
                data-weapon={`${cell}`}
                width={boxWidth}
                height={boxWidth}
                x={paddingX + boxSpaceX*x}
                y={paddingY + boxSpaceY*y}
                stroke="black" 
                fill={cell.includes(`(${altAbbr})`)?"white":rarity[weapon.rarity-1]}>
          </rect>);
        
        if ( paddingX + boxSpaceX*x > rightMax ) rightMax = paddingX + boxSpaceX*x;
        if ( paddingY + boxSpaceY*y > bottomMax) bottomMax = paddingY + boxSpaceY*y;

        // weapon icon
        theTree.push(
          <image id={`${cell.includes(`(${altAbbr})`)?altAbbr:curAbbr}icon-${itemMod}`}
                  className="main-icon"
                  data-weapon={`${cell}`}
                  href={cell.includes(`(${altAbbr})`)?`./ico/${altAbbr}.png`:
                                                      `./ico/${curAbbr}.png`}
                  x={paddingX + boxSpaceX*x}
                  y={paddingY + boxSpaceY*y}
                  width={boxWidth}
                  height={boxWidth}
                  onTouchStart={clickHandler}
                  onTouchCancel={touchHandler}
                  onTouchEnd={touchHandler}
                  onMouseDown={clickHandler}
                  onMouseOver={hoverHandler}
                  onMouseLeave={exitHandler}/>
        );
        // element icon(s)
        if ( weapon !== undefined && weapon.element !== "N/A" ) {
          theTree.push(
            <image id={`attr1-${itemMod}`}
                    className="icon"
                    data-weapon={`${cell}`}
                    href={`./ico/${weapon.element.split(" ")[0].toLowerCase()}.png`}
                    x={paddingX + (3*boxWidth/4) + boxSpaceX*x}
                    y={paddingY + (5*boxWidth/8) + boxSpaceY*y}
                    width={5*boxWidth/8}
                    height={5*boxWidth/8}/>
          );
          if( weapon.element.includes(' / ') ) { // for double element dual blades
            theTree.push(
              <image id={`attr2-${itemMod}`}
                      className="icon"
                      data-weapon={`${cell}`}
                      href={`./ico/${weapon.element.split(" / ")[1].split(' ')[0].toLowerCase()}.png`}
                      x={paddingX + (3*boxWidth/4) + boxSpaceX*x - 3*boxWidth/8}
                      y={paddingY + (5*boxWidth/8) + boxSpaceY*y}
                      width={5*boxWidth/8}
                      height={5*boxWidth/8}/>
            );
          }
        }
        // create-able icon
        if ( weapon !== undefined && weapon["create-cost"] !== "N/A" && x !== 0) {
          theTree.push(
            <image id={`create-${itemMod}`}
                    className="icon"
                    data-weapon={`${cell}`}
                    href={`./ico/create.png`}
                    x={paddingX - (5*boxWidth/8) + boxSpaceX*x}
                    y={paddingY + (boxWidth/8) + boxSpaceY*y}
                    width={3*boxWidth/4}
                    height={3*boxWidth/4}/>
          );
        }
      }
    }
  }
  // set the height and width of the svg element based on lowest and right-most elements


  return <svg width={rightMax + 2*boxWidth} height={bottomMax + 2*boxWidth} id="the-tree">{theTree}</svg>
}, (oldProps, newProps) => {
  if ( oldProps.currInfo.abbr !== newProps.currInfo.abbr ) return false;
  else if ( oldProps.zoom !== newProps.zoom ) return false;
  else if ( oldProps.collapsedTrees !== newProps.collapsedTrees ) return false;
  return true;
})

export default Tree;
