import snsData from './sns-data.js';
import snsMap from './sns-map.js';
import dbData from './db-data.js';
import dbMap from './db-map.js';
import NavBar from './navbar.js';

class Main extends React.Component {
  constructor() {
    super();

    this.state = { 
                   appTitle: "weapons",
                   subTitle: "sword and shield",
                   tagLine: "Hey, piece of shiny!",
                   mode: "tree",
                   listSortBy: "name",
                   listSortOrder: "asc",
                   zoom: 32,
                   oldZoom: 32,
                   itemSelect: "",
                   itemHover: "",
                   collapsedTrees: [],
                   ctrlState: false
                 };

    this.rowTicks = {};
    this.mouseDown = false;
    this.ctrlState = false;
    this.dragX = 0;
    this.dragY = 0;
    this.sharpColors = ["red", "ora", "yel", "gre", "blu", "whi", "pur"];

    this.dataAndMaps = { 'sword and shield': [snsData, snsMap, 'sns'], 'dual blades': [dbData, dbMap, 'db']}
    this.weaponAlts  = { 'sword and shield': ['Dual Blades', 'db'], 'dual blades': ['Sword and Shield', 'sns'] }
    this.abbr        = { 'sword and shield': ['sns', 'db'], 'dual blades': ['db', 'sns']}

    this.changeState = ( stateObj ) => { this.setState(stateObj) }

    this.displayList   = this.displayList.bind(this);
    this.displayTree   = this.displayTree.bind(this);
    this.buildPanelSharpness = this.buildPanelSharpness.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
    this.dragHandler   = this.dragHandler.bind(this);
    this.hoverHandler  = this.hoverHandler.bind(this);
    this.keyHandler    = this.keyHandler.bind(this);
    this.tooltip   = this.tooltip.bind(this);
  }

  componentDidMount(){
    document.onkeydown = this.keyHandler;
    document.onkeyup = this.keyHandler;
  }

  componentDidUpdate(){
    // track hiding/showing border highlight on tree collapsing/expanding or whole tree switch
    if ( this.state.mode === "tree" ){
      if ( document.querySelector('.active-border') )
        document.querySelectorAll('.active-border').forEach( border => border.classList.remove('active-border') );
      if ( this.state.itemSelect && this.state.itemSelect.type == this.dataAndMaps[this.state.subTitle][2] ){
        // do border update only if there wasn't a manual tree switch  
        if ( this.state.itemSelect && document.getElementById(this.state.itemSelectBorder)   ){
          let newBorder = document.getElementById(this.state.itemSelectBorder);
          if ( newBorder.dataset.weapon === this.state.itemSelect.name ) newBorder.classList.add('active-border')
        }
        else {
          let borders = Array.from(document.querySelectorAll('.icon-border'));
          let newBorder = borders.find( border => border.dataset.weapon.startsWith(this.state.itemSelect.name) );
          if ( newBorder ) newBorder.classList.add('active-border');
        }
      }
    }
  }

  displayList () {
    let sortKey = this.state.listSortBy;
    let theList = this.dataAndMaps[this.state.subTitle.toLowerCase()][0].sort((a,b) => {
      let valueA = 0;
      let valueB = 0;
      if ( this.state.listSortOrder === "asc"){
        valueA = a[sortKey].toLowerCase(); 
        valueB = b[sortKey].toLowerCase();
      } else { 
        valueA = b[sortKey].toLowerCase(); 
        valueB = a[sortKey].toLowerCase();
      }

      if ( sortKey == "attack" || sortKey == "rarity") {
        valueA = Number(valueA);
        valueB = Number(valueB);
      } else if ( sortKey == "affinity" ) {
        valueA = Number(valueA.slice(0,-1));
        valueB = Number(valueB.slice(0,-1));
      } else if ( sortKey == "bonus" ) {
        valueA = Number(valueA.slice(1)) || 0;
        valueB = Number(valueB.slice(1)) || 0;
      }else if ( sortKey == "element" ) {
        valueA = valueA==="n/a"?"a":valueA;
        valueB = valueB==="n/a"?"a":valueB;
      }

      if (valueA < valueB) return -1;
      if (valueA > valueB) return 1;
      return 0;
    })

    return (
      <div id="list-container" class="col-md-8 col-lg-9">
        <table id="weapon-list">
          <thead>
            <tr id="list-header-row" onClick={this.clickHandler}>
              <td class="list-header header-bold">Name</td>
              <td class="list-header">Attack</td>
              <td class="list-header">Element</td>
              <td class="list-header">Affinity</td>
              <td class="list-header">Sharpness</td>
              <td class="list-header">Slots</td>
              <td class="list-header">Defense</td>
              <td class="list-header">Rarity</td>
              <td class="list-header">Tree Link</td>
            </tr>
          </thead>
          <tbody>
            {theList.map( weapon =>{
              return (
                <tr id={`${weapon.name.toLowerCase()}-row`} class={weapon.name === this.state.itemSelect.name?"header-bold":null} onClick={this.clickHandler}>
                  <td id={`${weapon.name.toLowerCase()}-name`} class="list-cell pr-2" >{weapon.name}</td>
                  <td id={`${weapon.name.toLowerCase()}-attack`} class="list-cell pr-2">{weapon.attack}</td>
                  <td id={`${weapon.name.toLowerCase()}-element`} class="list-cell pr-2">{weapon.element}</td>
                  <td id={`${weapon.name.toLowerCase()}-affinity`} class="list-cell pr-2">{weapon.affinity}</td>
                  <td id={`${weapon.name.toLowerCase()}-sharpness`} class="list-cell pr-2">{this.buildPanelSharpness(weapon)}</td>
                  <td id={`${weapon.name.toLowerCase()}-slots`} class="list-cell pr-2">{weapon.slots}</td>
                  <td id={`${weapon.name.toLowerCase()}-defense`} class="list-cell pr-2">{weapon.bonus}</td>
                  <td id={`${weapon.name.toLowerCase()}-rarity`} class="list-cell pr-2">{weapon.rarity}</td>
                  <td id={`${weapon.name.toLowerCase()}-tree-link`} 
                      class="list-cell text-center" 
                      onClick={this.clickHandler}>
                        {weapon.name.endsWith("G")||(weapon["upgrade-to"]==="N/A"&&weapon["upgrade-from"]==="N/A")?null:<span>O</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
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
    const currMap = this.dataAndMaps[this.state.subTitle][1];
    const currData = this.dataAndMaps[this.state.subTitle][0];
    
    // modify grid based on currently collapsed trees
    let newGrid = currMap;
    let collapsed = this.state.collapsedTrees.map( val => val.slice(0,-5)); // remove ' Tree' from names
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
      if ( rowName.includes(this.weaponAlts[this.state.subTitle][1]) ) rowName = row[1];
      let currCollapsed = this.state.collapsedTrees;
      if (rowName !== "" && rowName !== "+"){
        theTree.push(
          <text class={`title tree-title-${currCollapsed.includes(rowName+" Tree")?'closed':'open'}`}
                x="5" 
                y={paddingY+5+boxWidth/2+boxSpaceY*y} 
                onClick={this.clickHandler}>
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
        let weapon  = currData[currData.findIndex(val=>val.name===cell)];
        let itemMod = `x${x}y${y}` // unique identifier for each border & icon
        if (cell !== "" && cell !== "+") {
          // border
          theTree.push(
            <rect id={`border-${itemMod}`} 
                  class="icon-border"
                  data-weapon={`${cell}`}
                  width={boxWidth}
                  height={boxWidth}
                  x={paddingX + boxSpaceX*x}
                  y={paddingY + boxSpaceY*y}
                  stroke="black" 
                  fill={cell.includes(this.weaponAlts[this.state.subTitle][1])?"white":rarity[weapon.rarity-1]}>
            </rect>);
          
          if ( paddingX + boxSpaceX*x > rightMax ) rightMax = paddingX + boxSpaceX*x;
          if ( paddingY + boxSpaceY*y > bottomMax) bottomMax = paddingY + boxSpaceY*y;

          let sub = this.state.subTitle;
          // weapon icon
          theTree.push(
            <image id={`${cell.includes(this.weaponAlts[sub][1])?this.weaponAlts[sub][1]:this.dataAndMaps[sub][2]}icon-${itemMod}`}
                   class="main-icon"
                   data-weapon={`${cell}`}
                   href={cell.includes(this.weaponAlts[sub][1])?`./public/icons/${this.weaponAlts[sub][1]}.png`:
                                                                `./public/icons/${this.dataAndMaps[sub][2]}.png`}
                   x={paddingX + boxSpaceX*x}
                   y={paddingY + boxSpaceY*y}
                   width={boxWidth}
                   height={boxWidth}
                   onTouchStart={this.clickHandler}
                   onTouchCancel={this.touchHandler}
                   onTouchEnd={this.touchHandler}
                   onMouseDown={this.clickHandler}
                   onClick={this.clickHandler}
                   onMouseOver={this.hoverHandler}
                   onMouseLeave={this.exitHandler}/>
          );
          // element icon(s)
          if ( weapon !== undefined && weapon.element !== "N/A" ) {
            theTree.push(
              <image id={`attr1-${itemMod}`}
                     class="icon"
                     data-weapon={`${cell}`}
                     href={`./public/icons/${weapon.element.split(" ")[0].toLowerCase()}.png`}
                     x={paddingX + (3*boxWidth/4) + boxSpaceX*x}
                     y={paddingY + (5*boxWidth/8) + boxSpaceY*y}
                     width={5*boxWidth/8}
                     height={5*boxWidth/8}/>
            );
            if( weapon.element.includes(' / ') ) { // for double element dual blades
              theTree.push(
                <image id={`attr2-${itemMod}`}
                       class="icon"
                       data-weapon={`${cell}`}
                       href={`./public/icons/${weapon.element.split(" / ")[1].split(' ')[0].toLowerCase()}.png`}
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
                     class="icon"
                     data-weapon={`${cell}`}
                     href={`./public/icons/create.png`}
                     x={paddingX - (5*boxWidth/8) + boxSpaceX*x}
                     y={paddingY + (boxWidth/8) + boxSpaceY*y}
                     width={3*boxWidth/4}
                     height={3*boxWidth/4}/>
            );
          }
        }
      });
    });
    // set the height and width of the svg element based on lowest and right-most elements


    return <svg width={rightMax + 2*boxWidth} height={bottomMax + 2*boxWidth} id="the-tree">{theTree}</svg>
  }

  clickHandler ( event ) {
    event.preventDefault()
    // handle click on zoom buttons
    if ( event.target.id.startsWith("zoom") ) this.btnTreeZoom(event.target.id)
    // handle click on mode button
    else if ( event.target.id.startsWith("mode") ) {
      this.setState({"mode": this.state.mode==="tree"?"list":"tree"})
    }
    // handle click on list table headers
    else if ( event.currentTarget.id === "list-header-row" ) {
      this.btnListTableHeader( event.target.textContent )
    }
    // handle click on list item (not tree link)
    else if ( event.currentTarget.id.endsWith('row') ) {
      this.setState({
        itemSelect: this.dataAndMaps[this.state.subTitle][0].find(weapon => weapon.name.toLowerCase()===event.currentTarget.id.split('-')[0])
      });
    }
    // handle click on list tree link
    else if ( event.currentTarget.id.endsWith("tree-link") && event.currentTarget.textContent ) {
      event.stopPropagation();
      this.btnListTreeLink( event.currentTarget.id );
    }
    // handle clicking on current tree's icons
    else if ( event.target.id.startsWith(`${this.dataAndMaps[this.state.subTitle][2]}icon`) ) {
      this.btnTreeIcon( event.target.dataset.weapon, `border-${event.target.id.split('-')[1]}` );
    }
    // handle clicking on alternate tree's icons
    else if ( event.target.id.startsWith(`${this.weaponAlts[this.state.subTitle][1]}icon`) ) {
      this.btnTreeAltIcon( event.target.dataset.weapon.split(' (')[0], event.target.id.split('-')[1] );
    }
    // handle collapsing of trees
    else if ( event.target.textContent.endsWith('Tree') ) {
      this.btnTreeCollapse( event.target.textContent )
    }
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

  btnListTableHeader ( textContent ) {
    // let's not sort by sharpness just yet
    if ( !['Sharpness', 'Tree Link', ''].includes(textContent) ) {
      let sortKey
      if ( textContent === 'Defense' ) sortKey = 'bonus'; // convert 'defense' header to 'bonus'
      else if ( textContent.length > 10 ) return null; // managed to click on empty area of the row or something
      else sortKey = textContent.toLowerCase()
      
      if ( sortKey == this.state.listSortBy ){
        this.setState({listSortOrder: this.state.listSortOrder==='asc'?'dec':'asc'})
      }
      else {
        document.querySelectorAll('.list-header').forEach( el => {
          let elText = el.textContent.toLowerCase();
          el.classList.remove('header-bold');
          if ( elText === sortKey || (elText === 'defense' && 'bonus' === sortKey) ) el.classList.add('header-bold');
        });
        this.setState({listSortBy: sortKey})
      }
    }
  }

  btnListTreeLink ( eventCurrTgtId ) {
    this.setState({
      itemSelect: this.dataAndMaps[this.state.subTitle][0].find(weapon => weapon.name.toLowerCase() === eventCurrTgtId.split('-')[0]),
      mode: 'tree'
    }, () => {
      let borders = Array.from(document.querySelectorAll('.icon-border'))
      let newBorder = borders.find( border => border.dataset.weapon.startsWith( this.state.itemSelect.name ))
      let newScrollHeight = Math.floor(newBorder.y.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetHeight/2;
      document.querySelector('#svg-overflow-wrapper').scrollTop = newScrollHeight;
      let newScrollWidth = Math.floor(newBorder.x.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetWidth/2;
      document.querySelector('#svg-overflow-wrapper').scrollLeft = newScrollWidth;
      this.setState( { itemSelectBorder: newBorder.id })
    });
  }

  btnTreeIcon ( weaponName, borderName ) {
    this.setState({
      itemSelect: this.dataAndMaps[this.state.subTitle][0].find( val => val.name === weaponName ),
      itemSelectBorder: borderName
    })
    if ( document.querySelector('.active-border') )
      document.querySelector('.active-border').classList.remove('active-border');
    document.getElementById(borderName).classList.add('active-border');
  }

  btnTreeAltIcon ( weaponName, iconPos ) {
    this.setState({
      subTitle: this.weaponAlts[this.state.subTitle][0].toLowerCase(),
      itemSelect: this.dataAndMaps[this.weaponAlts[this.state.subTitle][0].toLowerCase()][0].find( val => val.name === weaponName ),
      itemSelectBorder: ''
    }, ()=>{
      if ( document.querySelector('.active-border') )
        document.querySelector('.active-border').classList.remove('active-border');
      
      // find the new border
      let weapon = this.state.itemSelect;
      let newBorder = '';
      let prevWeapon = '';
      let prevWeaponIcon = '';
      if ( iconPos.startsWith('x0') ) { // the icon was the start of the other tree's branch
        console.log(iconPos);
        let borders = Array.from(document.querySelectorAll('.icon-border'));
        newBorder = borders.find( border => border.dataset.weapon.startsWith(this.state.itemSelect.name));
        this.setState({ itemSelectBorder: newBorder.id })
      }
      else {
        if ( weapon["upgrade-from"].length != 2 ) { // if not equal to two, it's not an array.
          prevWeapon = weapon["upgrade-from"];
        } else { //otherwise, it's an array
          prevWeapon = weapon["upgrade-from"].filter( oldWeapon => this.dataAndMaps[this.state.subTitle][0].find(val=>val.name===oldWeapon)===undefined)[0];
        }
        document.querySelectorAll('.main-icon').forEach( icon => icon.dataset.weapon.startsWith(prevWeapon)?prevWeaponIcon=icon:null)
        newBorder = prevWeaponIcon.nextElementSibling;
        this.setState({ itemSelectBorder: newBorder.id })

      }

      let newScrollHeight = Math.floor(newBorder.y.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetHeight/2;
      document.querySelector('#svg-overflow-wrapper').scrollTop = newScrollHeight;
      let newScrollWidth = Math.floor(newBorder.x.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetWidth/2;
      document.querySelector('#svg-overflow-wrapper').scrollLeft = newScrollWidth;
      
      let tooltip = document.querySelector("#tooltip");
      tooltip.style.opacity = 0;
      tooltip.style.left = `-300px`;
      tooltip.style.top = `-300px`;
    });
  }

  btnTreeCollapse ( textContent ) {
    let currCollapsed = this.state.collapsedTrees;
    let tree = textContent;
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

  btnTreeZoom ( eventId ) {
    let zoom = this.state.zoom;
    if ( eventId.includes("In") ) {
      if ( zoom < 40 ) this.setState({zoom: zoom + 8, oldZoom: zoom});
    }
    else {
      if ( zoom > 16 ) this.setState({zoom: zoom - 8, oldZoom: zoom});
    }
  }

  keyHandler ( event ) {
    if ( event.type === "keydown" && (event.code === "ControlLeft" || event.code === "ControlRight") && this.ctrlState == false ) {
      this.setState({ctrlState: true});
    }
    else if ( event.type === "keyup" && (event.code === "ControlLeft" || event.code === "ControlRight") ) {
      this.setState({ctrlState: false});
    }
  }

  touchHandler (event) {
    if (event.type == "touchend" || event.type == "touchstart" ) {
      event.preventDefault();
      this.clickHandler(event)
    }
    else if (event.type ="touchcancel" ) {
      event.preventDefault();
    }
  }

  buildPanelSharpness ( weapon ) {
    let sharpness = [];
    let sharpString = weapon.sharpness;
    for (let i=0; i<sharpString.length; i+=4) {
      sharpness.push(sharpString.slice(i,i+4));
    }
    return (
      <div class="sharp-container">
        {sharpness.map( (str, ind) => {
          return (
            <div class={`sharp-bar ${str[0].toLowerCase()} ${str.slice(1)} ${ind>0&&sharpness[ind-1].slice(-3)===str.slice(-3)?'sh-dbl':null}`}/>
          )}
        )}
      </div>
    )
  }

  hoverHandler ( event ) {
    let tooltip = document.querySelector("#tooltip");
    let htmlEl = document.querySelector("html");
    let mouseLoc = [event.pageX, event.pageY];  
    let currData = this.dataAndMaps[this.state.subTitle][0]
    let altData  = this.dataAndMaps[this.weaponAlts[this.state.subTitle][0].toLowerCase()][0]
    let weapon = currData.find( val=>val.name===event.target.dataset.weapon );
    if (weapon === undefined) weapon = altData.find( val=>val.name===event.target.dataset.weapon.split(' (')[0] );

    tooltip.style.opacity = 1;
    this.setState({ itemHover: weapon })

    //prevent tooltip from going out of bounds
    let projectedDiffY = (tooltip.offsetHeight + mouseLoc[1]) - (htmlEl.offsetHeight + htmlEl.scrollTop);
    let projectedDiffX = (tooltip.offsetWidth + mouseLoc[0]) - (htmlEl.offsetWidth + htmlEl.scrollLeft);    
    tooltip.style.top = `${mouseLoc[1]+10-(projectedDiffY>0?projectedDiffY+10:0)}px`;
    tooltip.style.left = `${mouseLoc[0]-(projectedDiffX>0?projectedDiffX:0)}px`;
  }

  exitHandler (event) {
    let tooltip = document.querySelector("#tooltip");
    tooltip.style.opacity = 0;
    tooltip.style.left = `-300px`;
    tooltip.style.top = `-300px`;
  }

  tooltip () {
    let selected = this.state.itemSelect; // is there an item selected? if yes, what is it
    let hoverItem = this.state.itemHover; // is there an item being hovered? if yes, what is it
    let altType = hoverItem.type===this.weaponAlts[this.state.subTitle][1]; // is the hover item's type not the current branches' type?
    let compare = this.state.ctrlState && selected.type===hoverItem.type && hoverItem.name !== selected.name; // is ctrl being held, are the types the same, and are the items different?
    return (
      <table id="tooltip" class="tooltip">
        <thead>
          <tr>
            <th id="tool-name" colspan="2">{!hoverItem?"*":hoverItem.name+(altType?` (${this.weaponAlts[this.state.subTitle][0]})`:"")}</th>
            <th id="compare-name" colspan="1">{compare?selected.name:null}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>{!hoverItem||altType?"Click to change trees":"Attack"}</b></td>
            <td id="tool-attack">{!hoverItem||altType?'':hoverItem.attack}</td>
            <td id="compare-attack" class="pl-2">{compare?selected.attack:null}</td>
          </tr>
          <tr>
            <td><b>{!hoverItem||altType?null:"Element"}</b></td>
            <td id="tool-element">{!hoverItem||altType?'':hoverItem.element}</td>
            <td id="compare-element" class="pl-2">{compare?selected.element:null}</td>
          </tr>
          <tr>
            <td><b>{!hoverItem||altType?null:"Sharpness"}</b></td>
            <td id="tool-sharp">
              {!hoverItem||altType?null:this.buildPanelSharpness(hoverItem)}
            </td>
          </tr><tr>
            <td />
            <td id="compare-sharp">
              {compare&&selected?this.buildPanelSharpness( this.state.itemSelect ):selected&&!altType&&hoverItem.name!==selected.name?"Compare with 'ctrl' ":null}
            </td>
          </tr>
        </tbody>
      </table>
    )
  }

  render () {
    let selectedWeapon = this.state.itemSelect;
    let title = this.state.appTitle;
    let subTitle = this.state.subTitle;
    return(
      <div id="app-wrapper" class="container-fluid d-flex flex-column" >
        <NavBar title={title} subTitle={subTitle} tagLine={this.state.tagLine} changeState={this.changeState}/>
        <div id="main-app-row" class="row m-0">
          {this.state.mode==="tree"?<div id="zoomInBtn" onClick={this.clickHandler}>+</div>:null}
          {this.state.mode==="tree"?<div id="zoomOutBtn" onClick={this.clickHandler}>-</div>:null}
          <div id="modeBtn" onClick={this.clickHandler} class="d-flex justify-content-center align-items-center">{this.state.mode==='tree'?"List":"Tree"}</div>
          {this.state.mode==="tree"?<div id="svg-overflow-wrapper" 
               class="col-md-8 col-lg-9"
               onMouseLeave={this.dragHandler}
               onMouseDown={this.dragHandler}
               onMouseUp={this.dragHandler}
               onMouseMove={this.dragHandler}>
            {this.displayTree()}
          </div>
          :this.displayList()}
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
                      <td id={`panel-${key}`} class="px-1">{key=="sharpness"?this.buildPanelSharpness(this.state.itemSelect):selectedWeapon[key]}</td>
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
                {Object.keys(selectedWeapon).filter(val=>val.startsWith('upgrade')).map( key => {
                  let title = key.split(''); title[0] = title[0].toUpperCase(); title = title.join('').split('-').join(' ');
                  return (
                    <tr>
                      <td class="px-1"><b>{title}</b></td>
                      {typeof selectedWeapon[key]==="object"?
                      <td id={`panel-${key}`} class="px-1">{selectedWeapon[key].map(val=><p class="m-0 p-0">{val}</p>)}</td>:
                      <td id={`panel-${key}`} class="px-1">{selectedWeapon[key]}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {this.tooltip()}

      </div>
    )
  }
}

ReactDOM.render(<Main />, document.querySelector("body"));
