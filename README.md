# mhfu-weapon-trees
a little bit more of an involved run at creating linked trees for the game Monster Hunter Freedom Unite

## why
In the game, there is the option to create weapons for your character to use when fighting monsters.
By visiting an in-game shop, you can use items you've collected to either make a weapon from scratch, or upgrade an existing weapon into a new one.
The potential upgrade routes are not known to the player past any current weapon's immediate upgrades. Information exists online for these routes, but I aimed to
collect that information and present it in a way I'm more excited about, and hopefully others are too.

## how
A web scraper was built using python to collect data from fan-made 'wiki' pages. Additional python was used to then organize the data into a grid in array/list format and then converted to a json string. Only mild manual changes were made to the collected data to account
for minor human errors found in the original data.

The json strings for both the grid and the originally scraped data is then served to the client-side JavaScript application and line, icon, and border positions are all calculated prior to placement of the elements into an SVG field. State refreshes are performed through React and Bootstrap JS/CSS is used for overall layout
assistance.

## what
The user selects a weapon type and the respective trees will be shown. By **clicking on the main tree names** on the left-side of the view, the player can minimize
that tree. By **hovering over any weapon icon**, a 'tool-tip' will be shown with minimal information on that weapon (desktop only). **Clicking on the icon**
will select that weapon and display additional information in the right-hand information panel (bottom of the screen for small devices). 
**Hovering and holding control** will compare the hovered weapon to a currently selected weapon (desktop only).

Users can **click the zoom buttons** in the top-right of the tree display area to zoom the tree in or out. When a user 
**clicks and drags** the main tree display area, the tree area will pan.
