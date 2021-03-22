import React from 'react';

const NavBar = ({ title, subTitle, tagLine, changeState }) => {
  const apps = { 
    weapons: { 
      title: "Weapons", 
      location: "https://trees.nyralen.com", 
      subs: [
        "Sword and Shield", 
        "Dual Blades", 
        "Great Sword", 
        "Long Sword",
        "Hunting Horn",
        "Hammer",
        "Gunlance",
        "Lance",
        "Bow"
      ]
    },
    kitchen: { 
      title: "Kitchen", 
      location: "https://kitchen.nyralen.com", 
      subs: [
        "Recipes", 
        "Skills"
      ]
    }
  }

  const clickHandler = ( event ) => {
    if ( event.target.className.includes('dropdown-opt') && event.currentTarget.id === 'app-dropdown' ) {
      let eventText = event.target.textContent.split('- ')[1];
      changeState({ 
        appTitle: eventText.toLowerCase(), 
        subTitle: apps[eventText.toLowerCase()].subs[0].toLowerCase() 
      });
      window.location = apps[eventText.toLowerCase()].location;
      document.querySelector('.drop-show').classList.remove('drop-show');
    }
    else if ( event.target.className.includes('dropdown-opt') && event.currentTarget.id === 'sub-dropdown' ) {
      let eventText = event.target.textContent.split('- ')[1];
      changeState({ subTitle: eventText.toLowerCase() })
      document.querySelector('.drop-show').classList.remove('drop-show');
    }
    else if ( event.currentTarget.className === 'nav-drop') event.currentTarget.querySelector('.dropdown-opt-list').classList.add('drop-show');
  }

  const buildDropdown = ( type ) => {
    let options = [];
    let currentApp = title;
    let currentSub = subTitle;
    Object.keys(apps).forEach( key => {
      if ( type === "app" ) 
        key===currentApp?options.unshift(apps[key].title):options.push(apps[key].title); // put current title in front
      else if ( type === "sub" && key === currentApp.toLowerCase() ) {
        options = apps[key].subs;
        if (options[0].toLowerCase() !== currentSub) { // pull current sub out and place in front (if not already in front)
          let currentInd = options.findIndex( sub => sub.toLowerCase() === currentSub );
          let tempSub = options[currentInd];
          options = options.slice(0, currentInd).concat(options.slice(currentInd+1));
          options.unshift(tempSub);
        }
      }
    })
    
    return (
      <div className="dropdown-wrapper mx-1">
        <div id={`${type}-dropdown`} className="nav-drop" onClick={clickHandler}>
          <div className="h1 title dropdown-curr">
            <span tabIndex="0" className="dropdown-title" id={`${type}-title`}>{`${type==="app"?"+":":"} ${options[0]}`}</span>
          </div>
          <div className="dropdown-opt-list border border-top-0 border-dark">
            {options.slice(1).sort( (optA, optB) => {
              if (optA < optB) return -1;
              if (optA > optB) return 1;
              return 0;
            }).map( (val,ind) => {
              return (
                <span className="h1 title my-0 mx-1 dropdown-opt" tabIndex="0" key={`opt-${val}`}>{`- ${val}`}</span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  window.addEventListener('click', (e) => { // collapse open nav dropdowns when clicking outside of them
    for (const select of document.querySelectorAll('.nav-drop')) {
        if (!select.contains(e.target)) {
            select.querySelector('.dropdown-opt-list').classList.remove('drop-show');
        }
    }
  });

  return (
    <div id="nav-bar" className="d-flex flex-wrap justify-content-between align-items-center border border-dark mb-2">
      <nav className="m-0 row">
            {buildDropdown("app")}
            {buildDropdown("sub")}
      </nav>
      <span className="h3 px-3 tag-line">{tagLine}</span>
    </div>
  )
  
}

export default NavBar;