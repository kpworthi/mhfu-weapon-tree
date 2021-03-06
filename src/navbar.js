const NavBar = ({ title, subTitle, tagLine, changeState }) => {
  let apps = { 
    weapons: { 
      title: "Weapons", 
      location: "https://trees.nyralen.com", 
      subs: [
        "Sword and Shield", 
        "Dual Blades", 
        "Great Sword", 
        "Long Sword", 
        "Hunting Horn", 
        "Hammer"
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

  let clickHandler = ( event ) => {
    if ( event.target.className === 'dropdown-title') event.currentTarget.querySelector('.dropdown-opt-list').classList.add('drop-show');
    else if ( event.target.className.includes('dropdown-opt') && event.currentTarget.id === 'app-dropdown' ) {
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
  }

  let buildDropdown = ( type ) => {
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
    
  
    //document.addEventListener('click', outsideClick);
    return (
      <div class="dropdown-wrapper mx-1">
        <div id={`${type}-dropdown`} class="nav-drop" onClick={clickHandler}>
          <div class="h1 title dropdown-curr">
            <span tabindex="0" class="dropdown-title" id={`${type}-title`}>{`${type==="app"?"+":":"} ${options[0]}`}</span>
          </div>
          <div class="dropdown-opt-list border border-top-0 border-dark">
            {options.slice(1).map( (val,ind) => {
              return (
                <span class="h1 title my-0 mx-1 dropdown-opt" tabindex="0">{`- ${val}`}</span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  window.addEventListener('click', function(e) { // collapse open nav dropdowns when clicking outside of them
    for (const select of document.querySelectorAll('.nav-drop')) {
        if (!select.contains(e.target)) {
            select.querySelector('.dropdown-opt-list').classList.remove('drop-show');
        }
    }
  });

  return (
    <div id="nav-bar" class="d-flex flex-wrap justify-content-between align-items-center border border-dark mb-2">
      <nav class="m-0 row">
            {buildDropdown("app")}
            {buildDropdown("sub")}
      </nav>
      <span class="h3 px-3 tag-line">{tagLine}</span>
    </div>
  )
  
}

export default NavBar;