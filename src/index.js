import React from 'react';
import ReactDOM from 'react-dom';

import './css/bootstrap.min.css'

import NavBar from './navbar.js';
import List from './list.js';
import Tree from './tree.js';
import snsData, { snsMap } from './sns-bundle.js';

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
                 
    this.currentType = 'sword and shield';
    this.rowTicks = {};
    this.mouseDown = false;
    this.ctrlState = false;
    this.dragX = 0;
    this.dragY = 0;


    // only load sns info to start, load rest after rendering
    this.dataAndMaps = { 
      'sword and shield': { data: snsData, map: snsMap, abbr: 'sns', alt: 'db', altFull: 'Dual Blades', icon: './icons/sns.png'},
      'dual blades'  : { data: '', map: '', abbr: 'db', alt: 'sns', altFull: 'Sword and Shield', icon: './icons/db.png'},
      'great sword'  : { data: '', map: '', abbr: 'gs', alt: 'ls', altFull: 'Long Sword', icon: './icons/gs.png'},
      'long sword'   : { data: '', map: '', abbr: 'ls', alt: 'gs', altFull: 'Great Sword', icon: './icons/ls.png'},
      'hunting horn' : { data: '', map: '', abbr: 'hh', alt: 'hm', altFull: 'Hammer', icon: './icons/hh.png'},
      'hammer'       : { data: '', map: '', abbr: 'hm', alt: 'hh', altFull: 'Hunting Horn', icon: './icons/hm.png'},
      'gunlance'     : { data: '', map: '', abbr: 'gl', alt: 'la', altFull: 'Lance', icon: './icons/gl.png'},
      'lance'        : { data: '', map: '', abbr: 'la', alt: 'gl', altFull: 'Gunlance', icon: './icons/la.png'},
      'bow'          : { data: '', map: '', abbr: 'bow', alt: '', altFull: '', icon: './icons/bow.png'}
    }

    this.hhSongs = []; // to be imported with rest of hh data

    this.changeState = ( stateObj, callback ) => { this.setState(stateObj, callback) }

    this.buildSharpness = this.buildSharpness.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
    this.dragHandler   = this.dragHandler.bind(this);
    this.keyHandler    = this.keyHandler.bind(this);
    this.tooltip   = this.tooltip.bind(this);
  }

  componentDidMount(){
    document.onkeydown = this.keyHandler;
    document.onkeyup = this.keyHandler;
    import('./db-bundle.js')
      .then( module => {
        this.dataAndMaps['dual blades'].data = module.default;
        this.dataAndMaps['dual blades'].map  = module.dbMap;
      });
    import('./gs-bundle.js')
      .then( module => {
        this.dataAndMaps['great sword'].data = module.default;
        this.dataAndMaps['great sword'].map  = module.gsMap;
      });
    import('./ls-bundle.js')
      .then( module => {
        this.dataAndMaps['long sword'].data = module.default;
        this.dataAndMaps['long sword'].map  = module.lsMap;
      });
    import('./hh-bundle.js')
      .then( module => {
        this.dataAndMaps['hunting horn'].data = module.default;
        this.dataAndMaps['hunting horn'].map  = module.hhMap;
        this.hhSongs                          = module.hhSongs;
      });
    import('./hm-bundle.js')
      .then( module => {
        this.dataAndMaps['hammer'].data = module.default;
        this.dataAndMaps['hammer'].map  = module.hmMap;
      });
      import('./gl-bundle.js')
        .then( module => {
          this.dataAndMaps['gunlance'].data = module.default;
          this.dataAndMaps['gunlance'].map  = module.glMap;
        });
      import('./la-bundle.js')
        .then( module => {
          this.dataAndMaps['lance'].data = module.default;
          this.dataAndMaps['lance'].map  = module.laMap;
        });
      /*
      import('./bow-bundle.js')
        .then( module => {
          this.dataAndMaps['bow'].data = module.default;
          this.dataAndMaps['bow'].map  = module.bowMap;
        });
      */
  }

  componentDidUpdate(){
    // track hiding/showing border highlight on tree collapsing/expanding or whole tree switch
    if ( this.state.mode === "tree" ){
      if ( document.querySelector('.active-border') )
        document.querySelectorAll('.active-border').forEach( border => border.classList.remove('active-border') );
      if ( this.state.itemSelect && this.state.itemSelect.type == this.dataAndMaps[this.state.subTitle].abbr ){
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

  clickHandler ( event ) {
    event.preventDefault()
    let timerStart = Date.now();
    // handle click on zoom buttons
    if ( event.target.id.startsWith("zoom") ) this.btnTreeZoom(event.target.id)
    // handle click on mode button
    else if ( event.target.id.startsWith("mode") ) {
      this.setState({"mode": this.state.mode==="tree"?"list":"tree"})
    }
    console.log(Date.now() - timerStart + " ms")
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

  buildNotesList ( noteString ) {
    let noteDict = { a: 'aqua', b: 'blue', p: 'purple', g: 'green', y: 'yellow', r: 'red', w: 'white'};
    let noteArray = noteString.match(/\.[a-z]+/g).map( newNote => noteDict[newNote.slice(1,2)])
    return (
      <div class="note-wrapper">
        {noteArray.map( color => 
          <div class={`note-block ${color.slice(0,3)} ml-1`} >
            <img class="note" src="../ico/note3.png" />
          </div> )}
      </div>
    )
  }

  buildSharpness ( weapon ) {
    let sharpness = [];
    let sharpString = weapon.sharpness;
    for (let i=0; i<sharpString.length; i+=4) {
      sharpness.push(sharpString.slice(i,i+4));
    }
    if ( sharpString === 'Unknown' ) return "Info Needed";
    else{
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
  }

  tooltip () {
    const selected = this.state.itemSelect; // is there an item selected? if yes, what is it
    const hoverItem = this.state.itemHover; // is there an item being hovered? if yes, what is it
    const altType = hoverItem.type===this.dataAndMaps[this.state.subTitle].alt; // is the hover item's type not the current branches' type?
    const compare = this.state.ctrlState && selected.type===hoverItem.type && hoverItem.name !== selected.name; // is ctrl being held, are the types the same, and are the items different?
    const isRanged = hoverItem?["bow","hbg","lbg"].includes(hoverItem.type):false;
    return (
      <table id="tooltip" class="tooltip">
        <thead>
          <tr>
            <th id="tool-name" colspan="2">{!hoverItem?"*":hoverItem.name+(altType?` (${this.dataAndMaps[this.state.subTitle].altFull})`:"")}</th>
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
              {!hoverItem||altType||isRanged?null:this.buildSharpness(hoverItem)}
            </td>
          </tr><tr>
            <td />
            <td id="compare-sharp">
              {compare&&selected?this.buildSharpness( this.state.itemSelect ):selected&&!altType&&hoverItem.name!==selected.name?"Compare with 'ctrl' ":null}
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

          {this.state.mode==="tree"?
          <div id="svg-overflow-wrapper" 
               class="col-md-8 col-lg-9"
               onMouseLeave={this.dragHandler}
               onMouseDown={this.dragHandler}
               onMouseUp={this.dragHandler}
               onMouseMove={this.dragHandler}>
            <Tree 
              changeState={this.changeState}
              zoom={this.state.zoom}
              oldZoom={this.state.oldZoom}
              currInfo={this.dataAndMaps[this.state.subTitle.toLowerCase()]}
              altInfo={this.dataAndMaps[this.dataAndMaps[this.state.subTitle].altFull.toLowerCase()]}
              currWeapon={this.state.itemSelect}
              collapsedTrees={this.state.collapsedTrees}
            />
          </div>
          :
          <List changeState={this.changeState} 
                 sortParam={this.state.listSortBy} 
                 sortOrder={this.state.listSortOrder}
                 currData={this.dataAndMaps[this.state.subTitle.toLowerCase()]}
                 currWeaponName={this.state.itemSelect.name}
                 subTitle={this.state.subTitle}
          />}

          <Panel selectedWeapon={selectedWeapon} 
                 buildSharpness={this.buildSharpness}
                 buildNotesList={this.buildNotesList}
                 hhSongs={this.hhSongs}
          />

        </div>

        {this.tooltip()}

      </div>
    )
  }
}

function Panel ( {selectedWeapon, buildSharpness, buildNotesList, hhSongs} ) {

  let wpnsWithExtra = [ 'hh', 'gl']
  let noteArray = [];
  if (selectedWeapon && selectedWeapon.type==="hh"){
    noteArray = selectedWeapon.notes.match(/\.[a-z]+/g).map( newNote => newNote.slice(1,2) )
  }

  return (
    <div id="info-panel" class="pt-1 pb-3 col-md-4 col-lg-3">
      <h2 class="title">Info Panel</h2>
      {/* Main Table */
      selectedWeapon===""?null:(
      <table id="panel-main-table" class="panel-main-table ml-2">
        <thead><tr> <th id="panel-weapon-name" class="text-center" colspan="2">{selectedWeapon.name}</th> </tr></thead>
        <tbody>
          {Object.keys(selectedWeapon).slice(1,wpnsWithExtra.includes(selectedWeapon.type)?9:8).map( key => {
            let title = key.split(''); title[0] = title[0].toUpperCase(); title = title.join('');
            return (
              <tr>
                <td class="px-1"><b>{title=="Bonus"?"Defense Bonus":title}</b></td>
                <td id={`panel-${key}`} class="px-1">
                  {key=="sharpness"?buildSharpness(selectedWeapon):
                                    key==="notes"?buildNotesList(selectedWeapon.notes, false):selectedWeapon[key]}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      )}
      {/* Song List */
      selectedWeapon===""||selectedWeapon.type!=="hh"?null:(
      <table id="panel-song-list" class="panel-song-list ml-2">
        <thead>
          <tr>
            <th id="panel-song-name" class="text-center" colspan="2">Song List</th>
          </tr>
        </thead>
        <tbody>
          {hhSongs
            .filter( song => {
              if ( song[1].split('').every( color => noteArray.includes(color) ) ) return true;
              else return false;
            }).map( validSong => (
              <tr class="valid-song-row">
                <td class="valid-song-notes pl-2">{buildNotesList("."+validSong[1].split('').join('.'), false)}</td>
                <td class="valid-song-name pl-2">{validSong[0]}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
      )}
      {/* Creation Table */
      selectedWeapon===""?null:(
      <table id="panel-create-table" class="panel-create-table ml-2">
        <thead>
          <tr>
            <th id="panel-create-name" class="text-center" colspan="2">From Scratch</th>
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
      {/* Upgrade Table */
      selectedWeapon===""?null:(
      <table id="panel-upgrade-table" class="panel-upgrade-table ml-2 mb-3">
        <thead>
          <tr>
            <th id="panel-upgrade-name" class="text-center" colspan="2">Upgrade</th>
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
  )
}

ReactDOM.render(<Main />, document.querySelector("body"));
