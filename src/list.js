import React from 'react';

const List = React.memo(({ changeState, sortParam, sortOrder, filters, currInfo, currentStats, buildSharpness, buildCoatings }) => {
  const clickHandler = ( event ) => {
    // handle click on list tree link
    if ( event.target.nodeName == "SPAN" && event.target.textContent ) {
      event.stopPropagation();
      btnListTreeLink( event.target.parentElement.parentElement.dataset.weapon );
    }
    // handle click on list table headers
    else if ( event.target.matches("td.list-header")  ) {
      btnListTableHeader( event.target.textContent )
    }
    // handle click on list item (not tree link)
    else if ( event.target.nodeName === 'TD' ) {
      changeState({
        itemSelect: currInfo.data.find(weapon => weapon.name===event.target.parentElement.dataset.weapon)
      });
    }
  }

  const btnListTableHeader = ( textContent ) => {
    // let's not sort by sharpness, coatings, or shot types just yet
    if ( !['Sharpness', 'Tree Link', 'Coatings', 'Shots', ''].includes(textContent) ) {
      let newSortKey = '';
      if ( textContent === 'Defense Bonus' ) newSortKey = 'bonus'; // convert 'defense' header to 'bonus'
      else if ( textContent.length > 10 ) return null; // managed to click on empty area of the row or something
      else newSortKey = textContent.toLowerCase()
      
      if ( newSortKey == sortParam ){ // swap ascending and descending orders
        changeState({listSortOrder: sortOrder==='asc'?'dec':'asc'})
      }
      else { // assign new sort order
        document.querySelectorAll('.list-header').forEach( el => {
          let elText = el.textContent.toLowerCase();
          el.classList.remove('header-bold');
          if ( elText === newSortKey || (elText === 'defense bonus' && 'bonus' === newSortKey) ) el.classList.add('header-bold');
        });
        changeState({listSortBy: newSortKey})
      }
    }
  }

  const btnListTreeLink = ( clickedWeapon ) => {

    changeState({
      itemSelect: currInfo.data.find(weapon => weapon.name === clickedWeapon),
      mode: 'tree'
    }, () => {
      let newBorder = Array.from(document.querySelectorAll('.icon-border')).find( ele => ele.dataset.weapon === clickedWeapon );
      if ( !newBorder ) { // weapon is likely in a collapsed tree, collapse trees, reassign new border, then proceed
        changeState( {collapsedTrees: []}, () => {
          newBorder = Array.from(document.querySelectorAll('.icon-border')).find( ele => ele.dataset.weapon === clickedWeapon );
        })
      }

      // once the new border is found correctly, scroll to it
      let newScrollHeight = Math.floor(newBorder.y.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetHeight/2;
      document.querySelector('#svg-overflow-wrapper').scrollTop = newScrollHeight;
      let newScrollWidth = Math.floor(newBorder.x.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetWidth/2;
      document.querySelector('#svg-overflow-wrapper').scrollLeft = newScrollWidth;
    });
  }

  const buildNotesPreview = ( noteList ) => {
    let noteDict = { a: 'aqua', b: 'blue', p: 'purple', g: 'green', y: 'yellow', r: 'red', w: 'white'};
    let noteArray = noteList.match(/\.[a-z]+/g).map( newNote => noteDict[newNote.slice(1,2)])
    return (
      <div className="note-wrapper">
        {noteArray.map( color => 
          <div className={`note-block-empty s ${color.slice(0,3)} ml-1`} key={color} />
        )}
      </div>
    )
  }

  const buildShotsPreview = ( shots ) => {
    let shotString = '';
    shots.forEach( shot => shotString += shot[0] + ' ' + shot[shot.length-1]);
    return shotString;
  }

  const theList = currInfo.data.sort((a,b) => {
    let valueA = 0;
    let valueB = 0;
    if ( sortOrder === "asc"){
      valueA = a[sortParam].toLowerCase(); 
      valueB = b[sortParam].toLowerCase();
    } else { 
      valueA = b[sortParam].toLowerCase(); 
      valueB = a[sortParam].toLowerCase();
    }

    // sort most by a numeric value, and element by the element name
    if ( sortParam == "attack" || sortParam == "rarity") {
      valueA = Number(valueA);
      valueB = Number(valueB);
    } else if ( sortParam == "affinity" ) {
      valueA = Number(valueA.slice(0,-1));
      valueB = Number(valueB.slice(0,-1));
    } else if ( sortParam == "bonus" ) {
      valueA = Number(valueA.slice(1)) || 0;
      valueB = Number(valueB.slice(1)) || 0;
    }else if ( sortParam == "element" ) {
      valueA = valueA==="n/a"?"a":valueA;
      valueB = valueB==="n/a"?"a":valueB;
    }

    if (valueA < valueB) return -1;
    if (valueA > valueB) return 1;
    return 0;
  })

  // map jsx to the headers and rows
  const listHeaderJSX = currentStats.map( stat => {
    let title = stat.split('');
    title[0] = title[0].toUpperCase();
    title = title.join('');
    return <td className="list-header" key={stat}>{title=="Bonus"?"Defense Bonus":title}</td>} 
  );

  let listRowsJSX = []; 
  for ( let i = 0; i<theList.length; i++) {
    const weapon = theList[i];
    let statsArray = [];
    statsArray.push(<td id={`${weapon.name.toLowerCase()}-name`} className="list-cell pr-2" >{weapon.name}</td>)
    for (let j = 0; j<currentStats.length; j++ ){
      const key = currentStats[j]
      statsArray.push(
        <td id={`${weapon.name.toLowerCase()}-${key}`} key={`${weapon.name}-${key}`} className="list-cell pr-2">
          {key==="sharpness"?buildSharpness( weapon.sharpness ):
          key==="notes"?buildNotesPreview( weapon.notes ):
          key==="coatings"?buildCoatings( weapon.coatings ):
          key==="shots"?buildShotsPreview( weapon.shots ):
          weapon[key]}
        </td>
      )
    }
    statsArray.push(
      <td id={`${weapon.name.toLowerCase()}-tree-link`} 
          className="list-cell text-center">
        {weapon.name.endsWith("G")||(weapon["upgrade-to"]==="N/A"&&weapon["upgrade-from"]==="N/A")?null:<span>O</span>}
      </td>
    )

    listRowsJSX.push(
      <tr id={`${weapon.name.toLowerCase()}-row`} 
          key={`${weapon.name.toLowerCase()}-row-key`}
          className="list-row"
          data-weapon={weapon.name}>
        { statsArray }
      </tr>
    )
  }

  return (
    <div id="list-container" className="col-md-8 col-lg-9">
      <table id="weapon-list" onMouseDown={clickHandler}>
        <thead>
          <tr id="list-header-row">
            <td className="list-header header-bold">Name</td>
            { listHeaderJSX }
            <td className="list-header">Tree Link</td>
          </tr>
        </thead>
        <tbody>
          { listRowsJSX }
        </tbody>
      </table>
    </div>
  )
}, ( oldProps, newProps) => {
  // update list component on new weapon type or new sort order
  if ( oldProps.currInfo.abbr !== newProps.currInfo.abbr ) return false;
  else if ( oldProps.sortParam !== newProps.sortParam ) return false;
  else if ( oldProps.sortOrder !== newProps.sortOrder ) return false;
  return true;
});

export default List;
