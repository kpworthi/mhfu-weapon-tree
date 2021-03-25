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
                 
    this.currentStats = [];
    this.mouseDown = false;
    this.timer = 0;
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
  }

  // once the component is loaded, add the key handlers used to catch the control key for comparisons in tree mode
  // additionally, load the rest of the bundles needed for viewing weapons other than sword and shield
  componentDidMount(){
    document.onkeydown = this.keyHandler;
    document.onkeyup = this.keyHandler;
    this.currentStats = this.buildStats( this.state.subTitle );
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
    import('./bow-bundle.js')
      .then( module => {
        this.dataAndMaps['bow'].data = module.default;
        this.dataAndMaps['bow'].map  = module.bowMap;
      });
  }

  // when the component is updated, check to make sure the proper icon is highlighted, or the proper
  // row is bolded.
  componentDidUpdate(){ 
    if ( this.state.mode === 'tree' ){
      const selectedBorder = Array.from(document.querySelectorAll('.icon-border')).find( ele => ele.dataset.weapon === this.state.itemSelect.name );
      const currentActive = document.querySelector('.active-border');
      if ( !selectedBorder ){
        if ( currentActive ) currentActive.classList.remove('active-border');
      }
      else if ( this.state.itemSelect && !selectedBorder.classList.contains('active-border') ){
        if ( currentActive ) currentActive.classList.remove('active-border');
        selectedBorder.classList.add('active-border');
        //console.log(`Time to highlight: ${new Date() - this.timer}`);
      }
    }
    else if ( this.state.mode === 'list' ) {
      const selectedRow = Array.from(document.querySelectorAll('.list-row')).find( ele => ele.dataset.weapon === this.state.itemSelect.name );
      const currentRow = document.querySelector('.header-bold');
      if ( !selectedRow ){
        if ( currentRow ) currentRow.classList.remove('header-bold');
      }
      else if ( this.state.itemSelect && !selectedRow.classList.contains('header-bold') ){
        if ( currentRow ) currentRow.classList.remove('header-bold');
        selectedRow.classList.add('header-bold');
        //console.log(`Time to bold: ${new Date() - this.timer}`);
      }
    }
  }

  clickHandler ( event ) {
    event.preventDefault()
    // handle click on zoom buttons
    if ( event.target.id.startsWith("zoom") ) this.btnTreeZoom(event.target.id)
    // handle click on mode button
    else if ( event.target.id.startsWith("mode") ) {
      this.setState({"mode": this.state.mode==="tree"?"list":"tree"})
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
    if ( event.type === "keydown" && (event.code === "ControlLeft" || event.code === "ControlRight") ) {
      this.setState({ctrlState: true});
    }
    else if ( event.type === "keyup" && (event.code === "ControlLeft" || event.code === "ControlRight") ) {
      this.setState({ctrlState: false});
    }
  }

  // return an array of JSX image items representing the coatings useable by a particular bow
  // expects: a 'coatings' string array such as ['power','paint']
  buildCoatingList ( coatings ) {
    const coatingColors = {
      'power': 'red',
      'close range': 'white',
      'poison': 'purple',
      'paralysis': 'yellow',
      'sleep': 'aqua', 
      'paint': 'pink'
    }
    return coatings.map( coating => {
      let coatingTitle = coating.split('');
      coatingTitle[0] = coatingTitle[0].toUpperCase();
      coatingTitle = coatingTitle.join('') + " Coating";
      return <img className={`coating-icon c${coatingColors[coating].slice(0,2)}`} src={`./ico/coat2.png`} title={coatingTitle}/>
    });
  }

  // return an array of JSX image items within a div wrapper representing the playable notes by a hunting horn
  // expects: a 'noteString' string which is usually in the format of "Note.purpleNote.blueNote.yellow"
  buildNotesList ( noteString ) {
    let noteDict = { a: 'aqua', b: 'blue', p: 'purple', g: 'green', y: 'yellow', r: 'red', w: 'white'};
    let noteArray = noteString.match(/\.[a-z]+/g).map( newNote => noteDict[newNote.slice(1,2)])
    return (
      <div className="note-wrapper">
        {noteArray.map( color => 
          <div className={`note-block ${color.slice(0,3)} ml-1`} >
            <img className="note" src="./ico/note3.png" />
          </div> )}
      </div>
    )
  }

  // return an array of JSX div items within a div wrapper representing the 'sharpness bar' of a weapon
  // expects: a 'sharpString' string which is usually in the format of "SredTredSoraMyelBgre"
  buildSharpness ( sharpString ) {
    let sharpness = [];
    for (let i=0; i<sharpString.length; i+=4) {
      sharpness.push(sharpString.slice(i,i+4));
    }
    if ( sharpString === 'Unknown' ) return "Info Needed";
    else{
      return (
        <div className="sharp-container">
          {sharpness.map( (str, ind) => {
            return (
              <div className={`sharp-bar ${str[0].toLowerCase()} ${str.slice(1)} ${ind>0&&sharpness[ind-1].slice(-3)===str.slice(-3)?'sh-dbl':null}`}
                   key={`sharp-bar-${str}-${ind}`}
              />
            )}
          )}
        </div>
      )
    }
  }

  // return an array of the non-name stats to be displayed per weapon in list-view, or in the main block of panel view
  // expects: a 'weaponType' string, either in abbreviated form or full name form. abbreviations will be caught and
  // converted to full form
  buildStats ( weaponType ) {
    const commonStatsUpper = ['attack', 'element'];
    const commonStatsLower = ['affinity', 'slots', 'bonus', 'rarity'];
    const extraStats = {
      "hunting horn": ["notes"],
      "gunlance": ["shelling"],
      "bow": ["coatings", "shots"],
      "heavy bowgun": ["reload", "recoil"],
      "light bowgun": ["reload", "recoil"]
    }
    const wpnAbbrTranslation = {
      'sns': 'sword and shield',
      'db' : 'dual blades',
      'gs' : 'great sword',
      'ls' : 'long sword',
      'hh' : 'hunting horn',
      'hm' : 'hammer',
      'la' : 'lance',
      'gl' : 'gunlance',
      'bow': 'bow'
    }
    if ( Object.keys(wpnAbbrTranslation).includes(weaponType) ) weaponType = wpnAbbrTranslation[weaponType];

    return (
           commonStatsUpper                                      //add first set
            .concat(weaponType.includes("bow")?[]:["sharpness"]) //add sharpness if a blademaster weapon
            .concat(extraStats[weaponType]||[])                  //add unique properties
            .concat(commonStatsLower)                            //add second set of common properties
    )
  }

  render () {
    let selectedWeapon = this.state.itemSelect;
    let title = this.state.appTitle;
    let subTitle = this.state.subTitle;
    this.timer = new Date();
    return(
      <div id="app-wrapper" className="container-fluid d-flex flex-column" >
        <NavBar title={title} subTitle={subTitle} tagLine={this.state.tagLine} changeState={this.changeState}/>
        <div id="main-app-row" className="row m-0" onMouseDown={this.clickHandler}>

          {this.state.mode==="tree"?<div id="zoomInBtn" >+</div>:null}
          {this.state.mode==="tree"?<div id="zoomOutBtn" >-</div>:null}
          {/*this.state.mode==="list"?<FilterBtn />:null*/}
          <div id="modeBtn" className="d-flex justify-content-center align-items-center">{this.state.mode==='tree'?"List":"Tree"}</div>

          {this.state.mode==="tree"?
          <div id="svg-overflow-wrapper" 
               className="col-md-8 col-lg-9"
               onMouseLeave = {this.dragHandler}
               onMouseDown  = {this.dragHandler}
               onMouseUp    = {this.dragHandler}
               onMouseMove  = {this.dragHandler}>
            <Tree 
              changeState    = {this.changeState}
              zoom           = {this.state.zoom}
              oldZoom        = {this.state.oldZoom}
              currInfo       = {this.dataAndMaps[this.state.subTitle.toLowerCase()]}
              altInfo        = {this.dataAndMaps[this.dataAndMaps[this.state.subTitle].altFull.toLowerCase()]}
              currWeapon     = {this.state.itemSelect}
              collapsedTrees = {this.state.collapsedTrees}
            />
          </div>
          :
          <List  changeState    = {this.changeState} 
                 sortParam      = {this.state.listSortBy} 
                 sortOrder      = {this.state.listSortOrder}
                 currInfo       = {this.dataAndMaps[this.state.subTitle.toLowerCase()]}
                 currentStats   = {this.buildStats( this.state.subTitle )}
                 buildSharpness = {this.buildSharpness}
                 buildCoatings  = {this.buildCoatingList}
          />}

          <Panel selectedWeapon   = {selectedWeapon} 
                 buildCoatingList = {this.buildCoatingList}
                 buildSharpness   = {this.buildSharpness}
                 buildNotesList   = {this.buildNotesList}
                 hhSongs          = {this.hhSongs}
                 currentStats     = {selectedWeapon?this.buildStats( selectedWeapon.type ):undefined}
          />

        </div>

        <Tooltip itemSelect     = {this.state.itemSelect}
                 itemHover      = {this.state.itemHover}
                 altAbbr        = {this.dataAndMaps[this.state.subTitle].alt}
                 altFull        = {this.dataAndMaps[this.state.subTitle].altFull}
                 ctrlState      = {this.state.ctrlState}
                 buildSharpness = {this.buildSharpness}
        />

        <p className="small">Images property of Capcom. A majority of the data obtained from <a href="https://monsterhunter.fandom.com">monsterhunter.fandom.com</a></p>

      </div>
    )
  }
}


// the Panel component displays tables that convey most of the available data on a selected weapon
// expects: the currently selected weapon 'selectedWeapon', the functions 'buildSharpness', 'buildCoatingList',
// 'buildNotesList', the list of hunting horn songs 'hhSongs', and the applicable stats for this weapon
// 'currentStats'
function Panel ( {selectedWeapon, buildSharpness, buildCoatingList, buildNotesList, hhSongs, currentStats} ) {

  // returns an array of JSX table row items detailing each of a weapons primary characteristics
  // expects: the array of applicable stats 'currentStats', the 'selectedWeapon' and all build functions
  const genStatBody = ( currentStats, selectedWeapon, buildSharpness, buildCoatingList, buildNotesList ) => {
    return currentStats.map( stat => {
      let title = stat.split(''); title[0] = title[0].toUpperCase(); title = title.join('');
      return (
        <tr key={selectedWeapon.name+" "+stat}>
          <td className="px-1"><b>{title=="Bonus"?"Defense Bonus":title}</b></td>
          <td id={`panel-${stat}`} className="px-1">
            {stat==="sharpness"?buildSharpness(selectedWeapon.sharpness):
             stat==="notes"?buildNotesList(selectedWeapon.notes):
             stat==="coatings"?buildCoatingList( selectedWeapon.coatings ):
             stat==="shots"?selectedWeapon.shots.map( shot => shot + " "):
             stat===""?'':
             selectedWeapon[stat]}
          </td>
        </tr>
      )
    })
  }

  // returns a JSX table of all the playable songs by a given hunting horn
  // expects: the 'hhSongs' list, the 'selectedWeapon', and the 'buildNotesList' function
  const genSongTable = ( hhSongs, selectedWeapon, buildNotesList ) => {
    const noteArray =  selectedWeapon.notes.match(/\.[a-z]+/g).map( newNote => newNote.slice(1,2) );
    const songBody = hhSongs.filter(song => {
      if (song[1].split('').every(color => noteArray.includes(color))) return true;
      else return false;
    }).map(validSong =>
      <tr className="valid-song-row" key={`song-${validSong[0]}`}>
        <td className="valid-song-notes pl-2">{buildNotesList("." + validSong[1].split('').join('.'), false)}</td>
        <td className="valid-song-name pl-2">{validSong[0]}</td>
      </tr>
    )

    return (
      <table id={`panel-song-list`} className="panel-song-list ml-2">
        <thead>
          <tr>
            <th id={`panel-song-name`} className="text-center" colSpan="2">Song List</th>
          </tr>
        </thead>
        <tbody>
          { songBody }
        </tbody>
      </table>
    )
  }

  // returns an array of JSX table rows for the properties relating to creation of a weapon from-scratch
  // expects: the 'selectedWeapon'
  const genCreateBody = ( selectedWeapon ) => {
    return selectedWeapon["create-cost"]!=="N/A"?Object.keys(selectedWeapon).filter(val=>val.startsWith('create')).map( key => {
      let title = key.split(''); title[0] = title[0].toUpperCase(); title = title.join('').split('-').join(' ');
      return (
        <tr key={`${key}-row`}>
          <td className="px-1"><b>{title}</b></td>
          {typeof selectedWeapon[key]==="object"?
          <td id={`panel-${key}`} className="px-1">{selectedWeapon[key].map(item=><p className="m-0 p-0" key={item}>{item}</p>)}</td>:
          <td id={`panel-${key}`} className="px-1">{selectedWeapon[key]}</td>}
        </tr>
      )
    }):<tr><td className="cell-type-unavail">This weapon cannot be created from scratch.</td></tr>
  }

  // returns an array of JSX table rows for the properties relating to creation of a weapon through upgrades
  // expects: the 'selectedWeapon'
  const genUpgradeBody = ( selectedWeapon ) => {
    return Object.keys(selectedWeapon).filter(val => val.startsWith('upgrade')).map(key => {
      let title = key.split(''); title[0] = title[0].toUpperCase(); title = title.join('').split('-').join(' ');
      return (
        <tr key={`${key}-row`}>
          <td className="px-1"><b>{title}</b></td>
          {typeof selectedWeapon[key] === "object" ?
            <td id={`panel-${key}`} className="px-1">{selectedWeapon[key].map(item => <p className="m-0 p-0" key={item}>{item}</p>)}</td> :
            <td id={`panel-${key}`} className="px-1">{selectedWeapon[key]}</td>}
        </tr>
      )
    })
  }

  // if no weapon has been selected yet, return an empty panel
  if ( selectedWeapon === "" ){
    return (
      <div id="info-panel" className="pt-1 pb-3 col-md-4 col-lg-3">
        <h2 className="title">Info Panel</h2>
        <p> No weapon has been selected yet. </p>
      </div>
    )
  }
  // otherwise, generate stat, create, and upgrade blocks
  // determine if an optional block is needed for more unique weapons
  // ( hunting horn, etc )
  else {
    const statBody    = genStatBody( currentStats, selectedWeapon, buildSharpness, buildCoatingList, buildNotesList );
    const createBody  = genCreateBody( selectedWeapon );
    const upgradeBody = genUpgradeBody( selectedWeapon );
    let optionalTable  = '';

    if ( selectedWeapon.type === 'hh' ) optionalTable = genSongTable( hhSongs, selectedWeapon, buildNotesList );

    return (
      <div id="info-panel" className="pt-1 pb-3 col-md-4 col-lg-3">
        <h2 className="title">Info Panel</h2>

        <table id="panel-main-table" className="panel-main-table ml-2">
          <thead>
            <tr>
              <th id="panel-weapon-title" className="text-center" colSpan="2">{selectedWeapon.name}</th>
            </tr>
          </thead>
          <tbody>
            { statBody }
          </tbody>
        </table>

        { optionalTable }
        
        <table id="panel-create-table" className="panel-create-table ml-2">
          <thead>
            <tr>
              <th id="panel-create-title" className="text-center" colSpan="2">From Scratch</th>
            </tr>
          </thead>
          <tbody>
            { createBody }
          </tbody>
        </table>

        <table id="panel-upgrade-table" className="panel-upgrade-table ml-2 mb-3">
          <thead>
            <tr>
              <th id="panel-upgrade-title" className="text-center" colSpan="2">Upgrade</th>
            </tr>
          </thead>
          <tbody>
            { upgradeBody }
          </tbody>
        </table>
      </div>
    )
  }
}

function Tooltip ( {itemSelect, itemHover, altAbbr, altFull, ctrlState, buildSharpness} ) {
  const selected = itemSelect || ""; // is there an item selected? if yes, what is it
  const hoverItem = itemHover || ""; // is there an item being hovered? if yes, what is it
  const hoverIsRanged = hoverItem?["bow","hbg","lbg"].includes(hoverItem.type):false; // is the hovered item a ranged weapon?
  const selectedIsRanged = selected?["bow","hbg","lbg"].includes(selected.type):false; // is the selected item a ranged weapon?
  const altType = hoverItem.type === altAbbr; // is the hover item's type not the current branches' type?
  const compare = ctrlState &&
                  selected &&
                  hoverItem.name !== selected.name; // is ctrl being held, is an item selected, and are the items different?

  if ( !hoverItem ) return <table id="tooltip" className="tooltip" />
  else if ( altType ) return (
    <table id="tooltip" className="tooltip">
      <thead>
        <tr>
          <th id="tool-name" colSpan="2">{`${hoverItem.name} (${altFull})`}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><b>Click to change trees</b></td>
        </tr>
      </tbody>
    </table>
  )
  else return (
    <table id="tooltip" className="tooltip">
      <thead>
        <tr>
          <th id="tool-header-name" colSpan="1">Name</th>
          <th id="tool-header-attack" colSpan="1">Attack</th>
          <th id="tool-header-element" colSpan="1">Element</th>
          <th id="tool-header-sharp" colSpan="1">Sharpness</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td id="tool-name" colSpan="1">{hoverItem.name}</td>
          <td id="tool-attack">{hoverItem.attack}</td>
          <td id="tool-element">{hoverItem.element}</td>
          <td id="tool-sharp">{hoverIsRanged?"N/A":buildSharpness( hoverItem.sharpness )}</td>
        </tr>
        {compare?
        <tr>
          <td id="compare-name" colSpan="1">{selected.name}</td>
          <td id="compare-attack">{selected.attack}</td>
          <td id="compare-element">{selected.element}</td>
          <td id="compare-sharp">{selectedIsRanged?"N/A":buildSharpness( selected.sharpness )}</td>
        </tr>:
        selected && hoverItem.name !== selected.name?
        <tr><td colSpan="4" className="font-italic">Compare with 'control' key</td></tr>:
        <tr><td colSpan="4" /></tr>}
      </tbody>
    </table>
  )
}

function FilterBtn ({}) {
  let expanded = false;
  return (
    <div id="filterBtn" className="">
      <span>{expanded?"X":"V"}</span>
    </div>
  )
}

ReactDOM.render(<Main />, document.getElementById("app-wrapper"));
