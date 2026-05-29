# Course Project Requirements Compliance Report (Escape from Tiamat)

Below is the evaluation of the **Escape from Tiamat** project against the minimum course requirements.

---

## Minimum Requirements Checklist

### 1. WebGL Implementation
* **Requirement:** The project should be implemented with WebGL.
* **Status:** **[✓] COMPLY (UYUYOR)**
* **Details:** The game is built using **Three.js** (a standard WebGL wrapper library). The graphics are rendered inside an HTML5 `<canvas>` element using `THREE.WebGLRenderer`, which compiles shaders and coordinates raw WebGL buffers in real-time.

### 2. 3D Camera Setup at Start
* **Requirement:** The project scene should definitely not be 2D (two-dimensional). At first, the camera should be positioned at an angle so that it can see the scene in 3D (definitely not from a bird's eye view directly from above or from side sections).
* **Status:** **[✓] COMPLY (UYUYOR)**
* **Details:** The scene is fully 3D. Upon spawning, the camera is placed inside the Captain's Cabin at coordinates `(4, 1.7, -22)` facing forward. The player sees a first-person 3D perspective of the cabin room (desk, bed, walls, door) rather than a flat 2D projection, bird's-eye view, or side cut section.

### 3. Camera Movement on 3 Axes and Free Rotation
* **Requirement:** The camera must be able to be moved in 3 axes (x, y, z) and rotate freely in 3 dimensions (by direct user input or by any other user interaction).
* **Status:** **[✓] COMPLY (UYUYOR)**
* **Details:** 
  * **Movement:** The player can walk along the **X** and **Z** axes using the `W`, `A`, `S`, `D` keys. The player can move along the vertical **Y** axis by climbing ladders (pressing `Space` to climb up, `C` to climb down) or by swimming up/down in the Flooded Pump Room.
  * **Rotation:** Using the **Pointer Lock API**, mouse movement rotates the camera freely in 3D space (yaw and pitch), allowing the player to look in any direction.

### 4. At Least 3 Object Types with Different Morphologies (Shapes)
* **Requirement:** There must be at least 3 object types with different morphologies (shapes) in the scene.
* **Status:** **[✓] COMPLY (UYUYOR)**
* **Details:** The game populates the submarine with highly distinct 3D geometries:
  1. **Rectangular Furniture/Structural Objects:** Cabin drawers, desks, bunks, and breaker boxes built using `THREE.BoxGeometry`.
  2. **Cylindrical Pipes & Valves:** Conduit networks and circular hand-wheels built using combinations of `THREE.CylinderGeometry` and `THREE.TorusGeometry`.
  3. **Spherical Indicators & Caps:** Status bulb indicators on panels and locks built using `THREE.SphereGeometry`.
  4. **Complex Compound Morphologies:** The **Generator Coil** (cylindrical core wound with copper torus rings) and the **Magnesium Tablets** (horizontal capsule cylinders inside floating torus rings).

### 5. At Least 3 Object Types with Different Textures
* **Requirement:** At least 3 different object types in the scene must have different textures.
* **Status:** **[✓] COMPLY (UYUYOR)**
* **Details:** To avoid loading external assets (making the build self-contained and lightweight), the project utilizes dynamic **`THREE.CanvasTexture`** objects mapped onto WebGL materials:
  1. **Pressure Gauge Face:** Uses a canvas texture showing printed dial increments, tick marks, and pressure numbers.
  2. **Simon Says Display:** Uses a canvas texture displaying screen-rendered instruction prompts ("F / CLICK: START", "WATCH...", "SOLVED", etc.).
  3. **Exit Door Status Label:** Uses a canvas texture displaying the text overlay "KİLİTLİ" / "LOCKED".
  4. *Note:* Additionally, all other object types use distinct procedural shaders/material settings (e.g., rusty steel specular maps, wood shininess, paper diffuse colors).

### 6. At Least 3 Object Types Controllable/Interactive by User
* **Requirement:** At least 3 different object types in the scene must be freely controllable by direct user input or by any other user interaction (not walls/floors; selection/control via mouse picking, keyboard keys, and/or UI).
* **Status:** **[✓] COMPLY (UYUYOR)**
* **Details:** The player directly interacts with and manipulates several 3D meshes:
  1. **Cabin Drawers:** Interacting with the Captain's desk drawer slides the mesh linearly along its local X axis to open/close it.
  2. **Drainage Valves:** Interacting with the underwater valves rotates the wheel meshes around their depth axes.
  3. **Generator Coil:** Inserting the coil spawns the coil mesh inside the generator socket, where it starts spinning continuously around its X axis.
  4. **Bulkhead Doors:** Opening doors rotates the door meshes around their pivot hinge groups by 90 degrees.
  5. **Wiring Panel Wires:** Interacting with the Breaker Box opens a 2D wiring UI canvas where the user clicks and drags wire ends to connect terminals.

### 7. At Least One Light Source Configured Obviously
* **Requirement:** There must be at least one light source and the scene must be configured in a way that it is obvious that there is light.
* **Status:** **[✓] COMPLY (UYUYOR)**
* **Details:** The scene is lit by several light sources that define the game's atmosphere:
  * An ambient/hemisphere base light (`THREE.AmbientLight` / `THREE.HemisphereLight`) providing base visibility.
  * Ceiling emergency red/white point lights (`THREE.PointLight`) placed in rooms.
  * A spotlight (`THREE.SpotLight`) representing the player's flashlight, which casts sharp real-time shadows on walls and items.

### 8. Moving Main Light Source with Adjustable Power/Brightness
* **Requirement:** The main light source in the scene must be able to be moved (by direct user input or other interaction). The power (brightness) of the light source should be able to be increased or decreased as desired.
* **Status:** **[✓] COMPLY (UYUYOR)**
* **Details:** 
  * **Movement:** The player's flashlight (`THREE.SpotLight`) is attached as a child of the camera. As the camera moves (WASD) and rotates (Mouse), the spotlight moves and rotates with it, projecting light dynamically onto whatever the player is looking at.
  * **Brightness Control:** The player can adjust the spotlight's intensity (power) directly using keyboard keys: pressing `E` increases brightness, and pressing `Q` decreases it, scaling the intensity between `0` and `10` units.

---

## Summary of Compliance

All **8 minimum requirements** are fully implemented, verified, and active in the current project source code. The project is eligible for the full base score of 50 points. 

Additional features implemented beyond the minimum requirements (positioning the project for the remaining 50 points):
* Custom 3D collision detection and gravity physics.
* Sanity and Oxygen meters with corresponding screen effects (vignettes, canvas blurs, and organic flashlight flickers).
* Linear adventure progression logic with multi-room key acquisition, water drainage, electrical repair, generator insertion, and bridge hatch escape.
