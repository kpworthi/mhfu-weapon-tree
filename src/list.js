import React from 'react';

const List = ({changeState, sortParam, sortOrder, currData, currWeaponName, subTitle}) => {

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
      btnListTreeLink( event.currentTarget.id );
    }
  }

  const btnListTableHeader = ( textContent ) => {
    // let's not sort by sharpness just yet
    if ( !['Sharpness', 'Tree Link', ''].includes(textContent) ) {
      let newSortKey = '';
      if ( textContent === 'Defense' ) newSortKey = 'bonus'; // convert 'defense' header to 'bonus'
      else if ( textContent.length > 10 ) return null; // managed to click on empty area of the row or something
      else newSortKey = textContent.toLowerCase()
      
      if ( newSortKey == sortParam ){
        changeState({listSortOrder: sortOrder==='asc'?'dec':'asc'})
      }
      else {
        document.querySelectorAll('.list-header').forEach( el => {
          let elText = el.textContent.toLowerCase();
          el.classList.remove('header-bold');
          if ( elText === newSortKey || (elText === 'defense' && 'bonus' === newSortKey) ) el.classList.add('header-bold');
        });
        changeState({listSortBy: newSortKey})
      }
    }
  }

  const btnListTreeLink = ( eventCurrTgtId ) => {
    changeState({
      itemSelect: currData.data.find(weapon => weapon.name.toLowerCase() === eventCurrTgtId.split('-tree')[0]),
      mode: 'tree'
    }, () => {
      let borders = Array.from(document.querySelectorAll('.icon-border'))
      let newBorder = borders.find( border => border.dataset.weapon.startsWith( currWeaponName ))
      let newScrollHeight = Math.floor(newBorder.y.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetHeight/2;
      document.querySelector('#svg-overflow-wrapper').scrollTop = newScrollHeight;
      let newScrollWidth = Math.floor(newBorder.x.baseVal.value)-document.querySelector('#svg-overflow-wrapper').offsetWidth/2;
      document.querySelector('#svg-overflow-wrapper').scrollLeft = newScrollWidth;
      changeState( { itemSelectBorder: newBorder.id })
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

  const buildSharpness = ( sharpString ) => {
    let sharpness = [];
    if ( sharpString === 'Unknown' ) return "Info Needed";
    else{
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
            <td class="list-header">Attack</td>
            <td class="list-header">Element</td>
            <td class="list-header">Affinity</td>
            {subTitle !== "hunting horn"?null:
            <td class="list-header">Notes</td>}
            {subTitle !== "gunlance"?null:
            <td class="list-header">Shelling</td>}
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
              <tr id={`${weapon.name.toLowerCase()}-row`} 
                  class={weapon.name === currWeaponName?"header-bold":null}
                  data-weapon={weapon.name}
                  onClick={clickHandler}>
                <td id={`${weapon.name.toLowerCase()}-name`} class="list-cell pr-2" >{weapon.name}</td>
                <td id={`${weapon.name.toLowerCase()}-attack`} class="list-cell pr-2">{weapon.attack}</td>
                <td id={`${weapon.name.toLowerCase()}-element`} class="list-cell pr-2">{weapon.element}</td>
                <td id={`${weapon.name.toLowerCase()}-affinity`} class="list-cell pr-2">{weapon.affinity}</td>
                {weapon.type !== "hh"?null:
                <td id={`${weapon.name.toLowerCase()}-notes`} class="list-cell pr-2">{buildNotesPreview(weapon.notes)}</td>}
                {weapon.type !== "gl"?null:
                <td id={`${weapon.name.toLowerCase()}-shelling`} class="list-cell pr-2">{weapon.shelling}</td>}
                <td id={`${weapon.name.toLowerCase()}-sharpness`} class="list-cell pr-2">{buildSharpness(weapon.sharpness)}</td>
                <td id={`${weapon.name.toLowerCase()}-slots`} class="list-cell pr-2">{weapon.slots}</td>
                <td id={`${weapon.name.toLowerCase()}-defense`} class="list-cell pr-2">{weapon.bonus}</td>
                <td id={`${weapon.name.toLowerCase()}-rarity`} class="list-cell pr-2">{weapon.rarity}</td>
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
