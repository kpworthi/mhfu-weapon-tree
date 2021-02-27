import snsData from './sns-data.js';
import snsMap from './sns-map.js';

class Main extends React.Component {
  constructor() {
    super();

    this.state = { zoom: 32,
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

    this.displayTree   = this.displayTree.bind(this);
    this.buildPanelSharpness = this.buildPanelSharpness.bind(this);
    this.buttonHandler = this.buttonHandler.bind(this);
    this.dragHandler   = this.dragHandler.bind(this);
    this.keyHandler    = this.keyHandler.bind(this);
    this.hoverHandler  = this.hoverHandler.bind(this);
    this.tooltipInfo   = this.tooltipInfo.bind(this);
  }

  componentDidMount(){
    document.onkeydown = this.keyHandler;
    document.onkeyup = this.keyHandler;
  }

  displayTree () {
    const boxWidth = this.state.zoom;
    const oldWidth = this.state.oldZoom;
    const hLineLength = boxWidth*1.5;
    const vLineLength = boxWidth/5;
    const boxSpaceX = hLineLength + boxWidth;
    const boxSpaceY = vLineLength + boxWidth;
    const paddingX = 250;
    const paddingY = 10;
    const rarity = ["white","#ececec","#b2c06a","#5f9757","#83b1bc","#6864b7","#8867c4","#b7846a","#dc5052","#8cb7e1"];
    let rightMax = 0; // track position of right-most element
    let bottomMax = 0; // track position of bottom-most element
    
    // modify grid based on currently collapsed trees
    let newGrid = snsMap;
    let collapsed = this.state.collapsedTrees.map( val => val.slice(0,-5));
    let rowFilter = [];
    let countFlag = false;
    newGrid.forEach( (val,ind) => {
      if( collapsed.includes(val[0]) ) countFlag = true;
      else if ( val[0] !== "" && val[0] !== "+" ) countFlag = false;
      else {
        if( countFlag ) rowFilter.push(ind);
      }
    });
    newGrid = newGrid.filter( (val,ind) => !rowFilter.includes(ind) );

    let theTree = []
    theTree.push(
      <defs>
      <linearGradient id="myGradient" gradientTransform="rotate(90)">
        <stop offset="5%"  stop-color="gold" />
        <stop offset="95%" stop-color="red" />
      </linearGradient>
    </defs>
    )
    newGrid.forEach( (row, y) => {
      // determine row name
      let rowName = row[0];
      let currCollapsed = this.state.collapsedTrees;
      if (rowName !== "" && rowName !== "+"){
        theTree.push(
          <text class={`title tree-title-${currCollapsed.includes(rowName+" Tree")?'closed':'open'}`}
                x="5" 
                y={paddingY+5+boxWidth/2+boxSpaceY*y} 
                onClick={this.buttonHandler}>
                  {`${rowName} Tree`}
          </text>
        );}    

      // calculate row horizontal line start/end
      let rowFirstItem = row.findIndex( (cell, ind ) => cell !== "");
      let rowLastItem = row.slice(rowFirstItem)
                           .findIndex( (cell, ind, arr ) => ind+1 === arr.length || arr[ind+1] === "") + rowFirstItem;

      // line paints from center of first item, unless it's a branch node
      // for branch nodes, it paints from the middle of the next cell over
      let lineX = 0;
      lineX = row[rowFirstItem] === "+"?(paddingX+boxWidth+hLineLength/2)+boxSpaceX*rowFirstItem:
                                        (paddingX+boxWidth/2)+boxSpaceX*rowFirstItem;
      let lineMod = row[rowFirstItem] === "+"?1:0;

      theTree.push(
        <rect id={`row-line-${y}`} 
              class="h-line" 
              width={(rowLastItem-rowFirstItem)*boxWidth + (rowLastItem-rowFirstItem-lineMod)*hLineLength}
              height="2" 
              x={lineX}
              y={(paddingY+boxWidth/2)+boxSpaceY*y-1} 
              stroke="black" 
              fill="black">
        </rect>);

      // paint vertical lines and the item boxes
      row.forEach( (cell, x) => {
        // calculate column line positions (only on first row iteration)
        if ( y === 0 ) {
          let vPairs = []; // array for all the start/end points for each vertical line
          let column = []; // array for the current column
          newGrid.forEach( rowAgain => column.push(rowAgain[x]) )
          if ( column.indexOf("+") !== -1 ) { // make sure there's a "+"
            for (let i=0; i<column.length; i++) { // iterate over each column item
              let cell = column[i];
              if (cell === "+") { // check to see if the current "+" is the last branch or not, then set it
                let cellLeft = column.slice(0,i);
                let cellRight = column.slice(i+1);
                let continueFlag = false;
                if ( i === column.length-1 ) vPairs.push([0,i]); // if it's the last "+" in a column, set it
                else {
                  for (let j=0; j<cellRight.length; j++) { // iterate over every item to the right of the current cell
                    
                    if (cellRight[j] === "+") {
                      continueFlag = true; // if it's another "+", it's not the last branch, check next item in column
                      break;
                    }
                    else if ( j === column.length-1 || j !== "" ) {
                      vPairs.push([0,i]); // add the y-position of "+" to the vPair array
                      break; // break early if it wasn't the end of the column
                    }
                  }
                }
                if (continueFlag) continue; // stop checking this column item if it was determined not the last branch

                for (let j=i-1; j >= 0; j--) { // iterate over every item to the left of the current cell
                  if (cellLeft[j] !== "+" && cellLeft[j] !== "") { // not a "+" or empty space, must be the branch root
                    vPairs[vPairs.length-1][0] = j; // modify the first val in last item in vPair to current index (y position)
                    break; // break early
                  }
                }
              }
            }
            // now paint the lines
            vPairs.forEach( (vPair, ind) => {
              let colFirstItem = vPair[0];
              let colLastItem = vPair[1];
              theTree.push(
                <rect id={`col-${x}-line-${ind+1}`} 
                      class="v-line" 
                      width="2"
                      height={(colLastItem-colFirstItem)*boxWidth + (colLastItem-colFirstItem)*vLineLength}
                      x={(paddingX+boxWidth+hLineLength/2)+boxSpaceX*x}
                      y={(paddingY+boxWidth/2)+boxSpaceY*colFirstItem} 
                      stroke="black" 
                      fill="black">
                </rect>);
            });
          }
        }
      
        // paint the item boxes and paste relevant icons
        let weapon = snsData[snsData.findIndex(val=>val.name===cell)];
        if (cell !== "" && cell !== "+") {
          // border
          theTree.push(
            <rect id={`${cell}-border`} 
                  class="icon-border" 
                  width={boxWidth}
                  height={boxWidth}
                  x={paddingX + boxSpaceX*x}
                  y={paddingY + boxSpaceY*y}
                  stroke="black" 
                  fill={cell.includes("Dual Swords")?"white":rarity[weapon.rarity-1]}>
            </rect>);
          
          if ( paddingX + boxSpaceX*x > rightMax ) rightMax = paddingX + boxSpaceX*x;
          if ( paddingY + boxSpaceY*y > bottomMax) bottomMax = paddingY + boxSpaceY*y;

          // weapon icon
          theTree.push(
            <image id={cell}
                   class="icon"
                   href={cell.includes("Dual Swords")?"./public/icons/ds.png":"./public/icons/sns.png"}
                   x={paddingX + boxSpaceX*x}
                   y={paddingY + boxSpaceY*y}
                   width={boxWidth}
                   height={boxWidth}
                   onTouchStart={this.buttonHandler}
                   onTouchCancel={this.touchHandler}
                   onTouchEnd={this.touchHandler}
                   onMouseDown={this.buttonHandler}
                   onClick={this.buttonHandler}
                   onMouseOver={this.hoverHandler}
                   onMouseLeave={this.exitHandler}/>
          );
          // element icon
          if ( weapon !== undefined && weapon.attribute !== "N/A" ) {
            theTree.push(
              <image id={cell+" attr"}
                     class="icon"
                     href={`./public/icons/${weapon.attribute.split(" ")[0].toLowerCase()}.png`}
                     x={paddingX + (3*boxWidth/4) + boxSpaceX*x}
                     y={paddingY + (5*boxWidth/8) + boxSpaceY*y}
                     width={5*boxWidth/8}
                     height={5*boxWidth/8}
                     onMouseDown={this.buttonHandler}/>
            );
          }
          // create-able icon
          if ( weapon !== undefined && weapon["create-cost"] !== "N/A" && x !== 0) {
            theTree.push(
              <image id={cell+"-create"}
                     class="icon"
                     href={`./public/icons/create.png`}
                     x={paddingX - (5*boxWidth/8) + boxSpaceX*x}
                     y={paddingY + (boxWidth/8) + boxSpaceY*y}
                     width={3*boxWidth/4}
                     height={3*boxWidth/4}
                     onMouseDown={this.buttonHandler}/>
            );
          }
        }
      });
    });
    // set the height and width of the svg element based on lowest and right-most elements


    return <svg width={rightMax + 2*boxWidth} height={bottomMax + 2*boxWidth} id="the-tree">{theTree}</svg>
  }

  dragHandler (event) {
    if ( event.type === "mousedown") {
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.mouseDown = true;
    }
    else if ( event.type === "mouseup") {
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.mouseDown = false;
    }
    else if ( event.type === "mousemove") {
      if ( this.mouseDown ) {
        let wrapper = document.querySelector('#svg-overflow-wrapper');
        let diff = [this.dragX-event.clientX, this.dragY-event.clientY];
        wrapper.scrollLeft = wrapper.scrollLeft + diff[0];
        wrapper.scrollTop = wrapper.scrollTop + diff[1]*2;
        this.dragX = event.clientX;
        this.dragY = event.clientY;
      }
    }
    else if ( event.type === "mouseleave" ) {
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.mouseDown = false;
    }
  }

  buttonHandler (event) {
    if (event.type === "mousedown") {
      event.preventDefault();
    }

    // handle click on zoom buttons
    else if ( event.target.id.startsWith("zoom") ) {
      let zoom = this.state.zoom;
      if ( event.target.id.includes("In") ) {
        if ( zoom < 40 ) this.setState({zoom: zoom + 8, oldZoom: zoom});
      }
      else {
        if ( zoom > 16 ) this.setState({zoom: zoom - 8, oldZoom: zoom});
      }
    }
    // handle clicking on icons
    else if ( event.target.className.baseVal === "icon" && !event.target.id.includes('Dual Swords') ) {
      event.preventDefault();
      this.setState({
        itemSelect: snsData.find( val => val.name === event.target.id )
      })
      if ( document.querySelector('.active-border') )
        document.querySelector('.active-border').classList.remove('active-border');
      document.getElementById(`${event.target.id}-border`).classList.add('active-border');
    }
    // handle collapsing of trees
    else if ( event.target.classList.toString().includes("tree-title") ) {
      event.preventDefault();
      let currCollapsed = this.state.collapsedTrees;
      let tree = event.target.textContent;
      if ( currCollapsed.includes(tree) ){
        let treeInd = currCollapsed.findIndex( val => val === tree );
        currCollapsed = currCollapsed.slice(0,treeInd).concat(currCollapsed.slice(treeInd+1));
        this.setState({
          collapsedTrees: currCollapsed
        });
      }
      else {
        this.setState({
          collapsedTrees: currCollapsed.concat(tree)
        });
      }
    }
  }

  keyHandler ( event ) {
    if ( event.type === "keydown" && (event.code === "ControlLeft" || event.code === "ControlRight") && this.ctrlState == false ) {
      this.setState({ctrlState: true});
      //document.querySelectorAll('.compare').forEach( element => element.classList.add('show') );
    }
    else if ( event.type === "keyup" && (event.code === "ControlLeft" || event.code === "ControlRight") ) {
      this.setState({ctrlState: false});
      //document.querySelectorAll('.compare').forEach( element => element.classList.remove('show') );
    }
  }

  touchHandler (event) {
    if (event.type == "touchend" || event.type == "touchstart" ) {
      event.preventDefault();
      this.buttonHandler(event)
    }
    else if (event.type ="touchcancel" ) {
      event.preventDefault();
    }
  }

  buildPanelSharpness () {
    let sharpness = [];
    let sharpString = this.state.itemSelect.sharpness;
    for (let i=0; i<sharpString.length; i+=4) {
      sharpness.push(sharpString.slice(i,i+4));
    }
    return sharpness.map( str => {
      return (
        <div class={`sharp-bar ${str[0].toLowerCase()} ${str.slice(1)}`}/>
      )
    })
  }

  buildToolSharpness (sharpString) {
    let colors = this.sharpColors;
    let sharpness = [];
    for (let i=0; i<sharpString.length; i+=4) {
      sharpness.push(sharpString.slice(i,i+4));
    }
    for (let each of colors) {
      let tag = sharpness.find( val => each === val.slice(1))
      if ( tag === undefined ){
        document.querySelector(`#tool-${each}-bar`).className = `n`;
      }
      else {
        document.querySelector(`#tool-${each}-bar`).className = `sharp-bar ${each} ${tag[0].toLowerCase()}`;
      }
    }
  }
  
  hoverHandler (event) {
    let tooltip = document.querySelector("#tooltip");
    let htmlEl = document.querySelector("html");
    let mouseLoc = [event.pageX, event.pageY];
    let weapon = snsData[snsData.findIndex(val=>val.name===event.target.id)];
    if (weapon === undefined) weapon = {
      name: event.target.id,
      attack: '*',
      attribute: '*',
      sharpness: '*'
    }
    document.querySelector("#tool-name").textContent = weapon.name;
    document.querySelector("#tool-attack").textContent = weapon.attack;
    document.querySelector("#tool-element").textContent = weapon.attribute;
    this.buildToolSharpness(weapon.sharpness); //document.querySelector("#tool-sharp").textContent = weapon.sharpness;
    tooltip.style.opacity = 1;
    let projectedDiff = (tooltip.offsetHeight + mouseLoc[1]) - (htmlEl.offsetHeight + htmlEl.scrollTop);
    
    tooltip.style.top = `${mouseLoc[1]+10-(projectedDiff>0?projectedDiff+10:0)}px`;
    tooltip.style.left = `${mouseLoc[0]}px`;
  }

  exitHandler (event) {
    let tooltip = document.querySelector("#tooltip");
    tooltip.style.opacity = 0;
    tooltip.style.left = `-300px`;
    tooltip.style.top = `-300px`;
  }

  tooltipInfo ( type ) {
    let selected = this.state.itemSelect;
    let compare = this.state.ctrlState;
    return (
      <table id="tooltip" class="tooltip">
        <thead>
          <tr>
            <th id="tool-name" colspan="2"/>
            <th id="compare-name" colspan="1">{compare?selected.name:null}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>Attack</b></td>
            <td id="tool-attack"/>
            <td id="compare-attack" class="pl-2">{compare?selected.attack:null}</td>
          </tr>
          <tr>
            <td><b>Element</b></td>
            <td id="tool-element"/>
            <td id="compare-element" class="pl-2">{compare?selected.attribute:null}</td>
          </tr>
          <tr>
            <td><b>Sharpness</b></td>
            <td id="tool-sharp">
              {this.sharpColors.map(val => <div id={`tool-${val}-bar`}/>)}
            </td>
          </tr><tr>
            <td />
            <td id="compare-sharp">
              {compare&&selected?this.buildPanelSharpness():null}
            </td>
          </tr>
        </tbody>
      </table>
    )
    /*
        <article id="intro" class="text-center">
          <p>Here you'll find horizontal trees for most of the sword-and-shield-type weapons in MHFU.</p>
        </article>
        */
  }

  render () {
    let selectedWeapon = this.state.itemSelect;
    return(
      <div id="app-wrapper" class="container-fluid d-flex flex-column" >
        <div id="title-bar" class="border border-dark text-center mb-2">
          <h1 class="title">Sword and Shield Crafting Tree</h1>
          <p class="h3 sub-heading">Hey, piece of shiny!</p>
        </div>
        <div id="main-app-row" class="row m-0 ">
          <div id="zoomInBtn" onClick={this.buttonHandler}>+</div>
          <div id="zoomOutBtn" onClick={this.buttonHandler}>-</div>
          <div id="svg-overflow-wrapper" 
               class="col-md-8 col-lg-9"
               onMouseLeave={this.dragHandler}
               onMouseDown={this.dragHandler}
               onMouseUp={this.dragHandler}
               onMouseMove={this.dragHandler}>
            {this.displayTree()}
          </div>
          <div id="info-panel" class="pt-1 pb-3 col-md-4 col-lg-3">
            <h2 class="title">Info Panel</h2>
            {selectedWeapon===""?null:(
            <table id="panel-main-table" class="panel-main-table ml-2">
              <thead><tr> <th id="panel-name" class="text-center" colspan="2">{selectedWeapon.name}</th> </tr></thead>
              <tbody>
                {Object.keys(selectedWeapon).slice(1,8).map( key => {
                  let title = key.split(''); title[0] = title[0].toUpperCase(); title = title.join('');
                  return (
                    <tr>
                      <td class="px-1"><b>{title=="Bonus"?"Defense Bonus":title}</b></td>
                      <td id={`panel-${key}`} class="px-1">{key=="sharpness"?this.buildPanelSharpness():selectedWeapon[key]}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            )}
            {selectedWeapon===""?null:(
            <table id="panel-create-table" class="panel-create-table ml-2">
              <thead>
                <tr>
                  <th id="panel-name" class="text-center" colspan="2">From Scratch</th>
                </tr>
              </thead>
              <tbody>
                {selectedWeapon["create-cost"]!=="N/A"?Object.keys(selectedWeapon).filter(val=>val.startsWith('create')).map( key => {
                  let title = key.split(''); title[0] = title[0].toUpperCase(); title = title.join('').split('-').join(' ');
                  return (
                    <tr>
                      <td class="px-1"><b>{title}</b></td>
                      {typeof selectedWeapon[key]==="object"?
                      <td id={`panel-${key}`} class="px-1">{selectedWeapon[key].map(val=><p class="m-0 p-0">{val}</p>)}</td>:
                      <td id={`panel-${key}`} class="px-1">{selectedWeapon[key]}</td>}
                    </tr>
                  )
                }):<tr><td class="cell-type-unavail">This weapon cannot be created from scratch.</td></tr>}
              </tbody>
            </table>
            )}
            {selectedWeapon===""?null:(
            <table id="panel-upgrade-table" class="panel-upgrade-table ml-2 mb-3">
              <thead>
                <tr>
                  <th id="panel-name" class="text-center" colspan="2">Upgrade</th>
                </tr>
              </thead>
              <tbody>
                {selectedWeapon["upgrade-cost"]!=="N/A"?Object.keys(selectedWeapon).filter(val=>val.startsWith('upgrade')).map( key => {
                  let title = key.split(''); title[0] = title[0].toUpperCase(); title = title.join('').split('-').join(' ');
                  return (
                    <tr>
                      <td class="px-1"><b>{title}</b></td>
                      {typeof selectedWeapon[key]==="object"?
                      <td id={`panel-${key}`} class="px-1">{selectedWeapon[key].map(val=><p class="m-0 p-0">{val}</p>)}</td>:
                      <td id={`panel-${key}`} class="px-1">{selectedWeapon[key]}</td>}
                    </tr>
                  )
                }):<tr><td class="cell-type-unavail">This weapon cannot be upgraded into.</td></tr>}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {this.tooltipInfo()}

      </div>
    )
  }
}

ReactDOM.render(<Main />, document.querySelector("body"));
