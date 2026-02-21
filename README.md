### My testing grounds for cool website features like a 3D game engine with iFrames integrated inside, a guestbook powered by nothing but a Google spreadsheet, and other interactive effects.

# Notes for when I forget:

## Three.js Demo

A 3D CSS renderer draws iFrames in 3D space. Over that, a WebGL renderer displays the 3D level, making sure to avoid rendering over the iFrames (done using occlusionObjects array in engine.js). Raycasts are performed on layer 0 every frame to check if the mouse is over a panel, in which case the WebGL layer's pointer events are disabled to allow for interacting with the iFrame. When an iFrame is partially obstructed, the html within it should bubble any mousemove events to the main window to update the raycast position (see guestbook.html for an implementation). To avoid obstructions from a specific object, set it to a different layer, and make sure the camera can see that layer.

engine.js is a module that sets up the renderers, handles the tricks mentioned above, and includes helpful functions for other modules.
There is a pixelation post processing effect that can be adjusted by changing `window.pixelScale` (4 by default).

ui.js overlays a HUD in the form of classic DOM elements. If a mobile device is detected, a joystick and 2 buttons are also added at the bottom of the screen. 

player.js uses functions from engine.js to create a capsule-shaped character controller. It also listens to updates from the ui.js joystick and the input handler in order to move around the character.

level.js defines the 3D scene, including the iFrames. In order for the player to be able to collide with any geometry, that mesh has to be pushed to the collisionObjects list. To save on resources, invisible simplified geometry should be paused instead. In the case of panels (iFrames) their first child object, being the occlusion mesh, should be added to the list.