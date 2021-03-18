import React from 'react';

const List = ({changeState, sortParam, sortOrder, currData, currWeaponName, subTitle, currentStats, buildSharpness, buildCoatings}) => {

  const clickHandler = ( event ) => {
    // handle click on list table headers
    if ( event.currentTarget.id === "list-header-row" ) {
      btnListTableHeader( event.target.textContent )
    }
    // handle click on list item (not tree link)
    else if ( event.currentTarget.id.endsWith('row') ) {
      changeState({
        itemSelect: currData.data.find(weapon => weapon.name===event.currentTarget.dataset.weapon)
      });
    }
    // handle click on list tree link
    else if ( event.currentTarget.id.endsWith("tree-link") && event.currentTarget.textContent ) {
      event.stopPropagation();
      btnListTreeLink( event.currentTarget.parentElement.dataset.weapon );
    }
  }

  const btnListTableHeader = ( textContent ) => {
    // let's not sort by sharpness just yet
    if ( !['Sharpness', 'Tree Link', 'Coatings', 'Shots', ''].includes(textContent) ) {
      let newSortKey = '';
      if ( textContent === 'Defense Bonus' ) newSortKey = 'bonus'; // convert 'defense' header to 'bonus'
      else if ( textContent.length > 10 ) return null; // managed to click on empty area of the row or something
      else newSortKey = textContent.toLowerCase()
      
      if ( newSortKey == sortParam ){
        changeState({listSortOrder: sortOrder==='asc'?'dec':'asc'})
      }
      else {
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
    let scrollTo = ( newBorder ) => {
      let newScrollHeight = Math.floor(newBorder.y.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetHeight/2;
      document.querySelector('#svg-overflow-wrapper').scrollTop = newScrollHeight;
      let newScrollWidth = Math.floor(newBorder.x.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetWidth/2;
      document.querySelector('#svg-overflow-wrapper').scrollLeft = newScrollWidth;
    }

    changeState({
      itemSelect: currData.data.find(weapon => weapon.name === clickedWeapon),
      mode: 'tree'
    }, () => {
      let newBorder = Array.from(document.querySelectorAll('.icon-border')).find( ele => ele.dataset.weapon === clickedWeapon );
      if ( !newBorder ) { // weapon is likely in a collapsed tree, collapse trees, reassign new border, then proceed
        changeState( {collapsedTrees: []}, () => {
          newBorder = Array.from(document.querySelectorAll('.icon-border')).find( ele => ele.dataset.weapon === clickedWeapon );
          scrollTo(newBorder);
        })
      }
      else { // weapon is likely not in a collapsed tree. proceed normally
        scrollTo(newBorder);
      }
    });
  }

  const buildNotesPreview = ( noteList ) => {
    let noteDict = { a: 'aqua', b: 'blue', p: 'purple', g: 'green', y: 'yellow', r: 'red', w: 'white'};
    let noteArray = noteList.match(/\.[a-z]+/g).map( newNote => noteDict[newNote.slice(1,2)])
    return (
      <div class="note-wrapper">
        {noteArray.map( color => 
          <div class={`note-block-empty s ${color.slice(0,3)} ml-1`} />
        )}
      </div>
    )
  }

  const buildShotsPreview = ( shots ) => {
    let shotString = '';
    shots.forEach( shot => shotString += shot[0] + ' ' + shot[shot.length-1]);
    return shotString;
  }

  let theList = currData.data.sort((a,b) => {
    let valueA = 0;
    let valueB = 0;
    if ( sortOrder === "asc"){
      valueA = a[sortParam].toLowerCase(); 
      valueB = b[sortParam].toLowerCase();
    } else { 
      valueA = b[sortParam].toLowerCase(); 
      valueB = a[sortParam].toLowerCase();
    }

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

  return (
    <div id="list-container" class="col-md-8 col-lg-9">
      <table id="weapon-list">
        <thead>
          <tr id="list-header-row" onClick={clickHandler}>
            <td class="list-header header-bold">Name</td>
            {currentStats.map( stat => {
              let title = stat.split('');
              title[0] = title[0].toUpperCase();
              title = title.join('');
              return <td class="list-header">{title=="Bonus"?"Defense Bonus":title}</td>} 
            )}
            <td class="list-header">Tree Link</td>
          </tr>
        </thead>
        <tbody>
          {theList.map( weapon =>{
            return (
              <tr id={`${weapon.name.toLowerCase()}-row`} 
                  class={weapon.name === currWeaponName?"header-bold":null}
                  data-weapon={weapon.name}
                  onClick={clickHandler}>
                <td id={`${weapon.name.toLowerCase()}-name`} class="list-cell pr-2" >{weapon.name}</td>
                {currentStats.map( key => {
                  return (
                    <td id={`${weapon.name.toLowerCase()}-${key}`} class="list-cell pr-2">
                      {key=="sharpness"?buildSharpness(weapon.sharpness):
                       key==="notes"?buildNotesPreview(weapon.notes):
                       key==="coatings"?buildCoatings( weapon.coatings ):
                       key==="shots"?buildShotsPreview( weapon.shots ):
                       weapon[key]}
                    </td>
                  )
                })}
                <td id={`${weapon.name.toLowerCase()}-tree-link`} 
                    class="list-cell text-center" 
                    onClick={clickHandler}>
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

export default List;
