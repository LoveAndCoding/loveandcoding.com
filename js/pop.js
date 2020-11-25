/**
 * Hi and welcome!
 *
 * This file is used in the "pop" section of the site to render our 3D animated
 * background using Three.js. The scene shows a heart floating down a street
 * in a "pop" aesthetic. Truthfully, it's less pop more a cross between 80s
 * "radical" style and a neon faux-futuristic look, but "pop" seemed like a
 * more fun name.
 *
 * Throughout this file is as many comments as I could include to help folks
 * not only see how this works, but learn a bit about Three.js or 3D rendering'
 * in the process if you are unfamiliar. Before starting this project, I had
 * never actually used the library, though I did know some very very basic 3D
 * modeling concepts. However, I learned a lot throughout this, and the notes
 * and comments here are meant to represent my learning journey as well.
 */

import * as Three from "./three/build/three.module.js";
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "./three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "./three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SubsurfaceScatteringShader } from "./three/examples/jsm/shaders/SubsurfaceScatteringShader.js";

// Rendering variables
let camera, scene, renderer, controls, clock, composer;
// Model variables
let heart, grid, buildings, buildingStack;
// Control variables
let cameraDriftToX, cameraDriftToY;

// Animation Constants
const HEART_SWAY_ANIMATION_TIME = 1.7; // 3 seconds
const HEART_FLOAT_ANIMATION_TIME = 0.8; // 3 seconds
const HEART_SWAY_AMOUNT = 0.2;
const HEART_FLOAT_AMOUNT = 0.03;
const TRAVEL_SPEED = 1 / 5; // We go 8 squares every 1 second
const CAMERA_MOVE_SPEED = 0.1;

// Model/Drawing Constants
const GROUND_LEVEL = -0.9;
const GRID_LEVEL = GROUND_LEVEL + 0.08;
const STREET_WIDTH = 12;
const MIN_BUILD_SIZE = 2;
const MAX_BUILD_SIZE = 7;
const BUILD_WIDTH = 4;
const BUILD_DEPTH = 4;
const BUILD_GAP = 1;
const BUILD_SPACE = BUILD_DEPTH + BUILD_GAP;
const DRAW_DISTANCE = 40;

// Colors
const WHITE = 0xffffff;
const GRAY = 0x7f7f7f;
const BLACK = 0x000000;
const RED = 0xe80e0e;
const DEEP_RED = 0x5d0909;
const BLUE = 0x293178;
const LIGHT_PURPLE = 0x591b4e;
const PURPLE = 0x381131;
const DEEP_PURPLE = 0x08030d;

/**
 * Initialize our Scene
 */
function initScene() {
	// Create our renderer with all the right fixings
	renderer = new Three.WebGLRenderer({});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	// Tone mapping gives us an overall tone or look to the rendering. We use
	// Cineon tone mapping because it gives us a higher contrast, especially
	// with the bloom in place
	renderer.toneMapping = Three.CineonToneMapping;
	renderer.toneMappingExposure = Math.pow(0.82, 4.0);

	// We want to create a "clipping" container that can be used to clip any
	// excess content without causing a scrollbar. This is styled in the CSS
	const container = document.createElement("div");
	container.classList.add("animated-background");
	document.body.appendChild(container);
	container.appendChild(renderer.domElement);

	// Finally we create the scene, and add a bit of fog so we can't see the
	// hard edge when we reach the draw distance
	scene = new Three.Scene();
	scene.fog = new Three.FogExp2(BLACK, 0.06);

	// We also want our background. We use a background instead of a skybox
	// because we have a limited viewpoint so we don't need the complexity
	// of wrapping our image into the 3D space.
	const loader = new Three.TextureLoader();
	const bgTexture = loader.load("/images/pop.background.png");
	scene.background = bgTexture;

	// When we've got our scene, we create (and auto-start) our rendering clock
	clock = new Three.Clock();
}

/**
 * Initialize our camera for the scene
 */
function initCamera() {
	// A perspective camera is the best here since we want to be able to
	// "travel" down our street
	camera = new Three.PerspectiveCamera(
		70,
		window.innerWidth / window.innerHeight,
		0.01,
		DRAW_DISTANCE
	);

	// Orbit controls allow us to move the camera but keep it pointed at our
	// heart still, without having to do all the calculations ourselves
	controls = new OrbitControls(camera, renderer.domElement);

	// We want some nice defaults for pointing at the scene
	camera.position.y = 0.01;
	camera.position.z = 1.3;
	camera.rotation.x = -0.01;

	// The viewer doesn't have direct control of this since we want this in the
	// background of the site, so we disable controls here (as well as turning
	// off pointer interaction in CSS) to just make sure viewers can't mess
	// with the camera.
	controls.enabled = false;
	controls.enablePan = false;
	controls.enableZoom = false;

	// Technically I don't believe these limits work with how we're using it,
	// but there's no harm in guardrails
	const vertCameraRange = Math.PI / 12;
	const horzCameraRange = Math.PI / 10;
	const halfPi = Math.PI / 2;
	controls.minPolarAngle = halfPi - vertCameraRange;
	controls.maxPolarAngle = halfPi + vertCameraRange;
	controls.minAzimuthAngle = -horzCameraRange;
	controls.maxAzimuthAngle = horzCameraRange;

	controls.update();
}

/**
 * Initialize our lighting for the scene.
 */
function initLights() {
	// First, we want a directional light to shine onto our heart to light it
	// and show highlights as we move
	const color = WHITE;
	const intensity = 1.6;
	const dirLight = new Three.DirectionalLight(color, intensity);
	dirLight.position.z = 0.5;
	dirLight.position.y = 2;
	dirLight.position.x = -1.5;
	dirLight.castShadow = true;
	scene.add(dirLight);

	// Second, we want a Hemisphere light to make sure the ground and sky are
	// appropriately lit with the right colors and emit a color as needed
	const hemiLight = new Three.HemisphereLight(DEEP_PURPLE, LIGHT_PURPLE, 0.2);
	scene.add(hemiLight);

	// Finally, we want an ambient light to make our scene just overall a bit
	// brighter. The effect here is brining up the darker colors to a slightly
	// lighter shade.
	const ambientLight = new Three.AmbientLight(WHITE, 0.1);
	scene.add(ambientLight);
}

/**
 * Initialize our ground, so we're not just flying through empty space
 */
function initGround() {
	// We want just a simple plane to use as out ground, and make it big enough
	// to cover all of our visual space. Also, make it purple so the lighting
	// makes it stand out
	const groundGeo = new Three.PlaneBufferGeometry(
		DRAW_DISTANCE,
		DRAW_DISTANCE
	);
	const groundMat = new Three.MeshStandardMaterial({ color: PURPLE });

	// We want to position everything so it's in the right place
	const ground = new Three.Mesh(groundGeo, groundMat);
	ground.position.y = GROUND_LEVEL;
	ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;
	scene.add(ground);

	// And then we want a grid on top of it, both to provide a reference point
	// for the viewer, but also because it looks "futuristic" (oooh!, aaah!).
	// Note we use a "helper" for this rather than drawing the lines ourselves
	// as it just saves us some code.
	//
	// A potential future improvement is to draw the lines ourselves so we can
	// add width to the lines, and so we can do some other tricks with our
	// animations or to add material or depth to the ground
	grid = new Three.GridHelper(
		DRAW_DISTANCE * 2,
		DRAW_DISTANCE * 2,
		BLUE,
		BLUE
	);
	grid.position.y = GRID_LEVEL;
	grid.position.x = 0.5;
	scene.add(grid);
}

/**
 * Initialize the shaders we need for our Heart model
 *
 * @returns {material} Shader material for use with our heart
 */
function initHeartShaders() {
	// First load in some textures. The details on these don't come through
	// very much in our final result, but they help with the subsurface
	// scattering, and give it just a bit of depth, even through the bloom
	const loader = new Three.TextureLoader();
	const imgTexture = loader.load("/images/scuffed-plastic-red.png");
	const thicknessTexture = loader.load(
		"/images/scuffed-plastic-thickness.png"
	);
	imgTexture.wrapS = imgTexture.wrapT = Three.RepeatWrapping;

	// We want to use the subsurface scattering shader to give the model a bit
	// more depth. With the bloom on the scene, this can be hard to see, but
	// it does make a difference both in the rendering and the bloom itself.
	//
	// Subsurface scattering is where light penetrates the surface of an object
	// to some degree and bounces "within" it. This is something that occurs
	// for most materials in the world, and is emulated using this shader.
	const shader = SubsurfaceScatteringShader;
	const uniforms = Three.UniformsUtils.clone(shader.uniforms);

	// Add our base texture
	uniforms["map"].value = imgTexture;

	// Control how light will penetrate and be reflected from the "subsurface"
	uniforms["diffuse"].value = new Three.Vector3(0.8, 0.1, 0.3);
	uniforms["shininess"].value = 350;

	// Get some "thickness" for our subsurface scattering. This helps add some
	// depth to our model and allows light to filter through it a bit
	uniforms["thicknessMap"].value = thicknessTexture;
	uniforms["thicknessColor"].value = new Three.Color(DEEP_RED);
	uniforms["thicknessDistortion"].value = 0.7;
	uniforms["thicknessAmbient"].value = 0.4;
	uniforms["thicknessAttenuation"].value = 0.8;
	uniforms["thicknessPower"].value = 4;
	uniforms["thicknessScale"].value = 10;

	// Put it all together and what does that spell? Material.
	const material = new Three.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader,
		lights: true,
	});
	material.extensions.derivatives = true;

	return material;
}

/**
 * Initialize our Heart model and add it to the scene
 */
function initHeart() {
	// Get our fancy shaders, described above
	const material = initHeartShaders();

	// Create a group, since our heart is more than just a heart. Note that
	// this group is a global object so we can animate it later
	heart = new Three.Group();
	scene.add(heart);

	// We want to give the illusion that our heart is glowing, so we create
	// three red spotlights to project onto the rest of the scene. The first
	// points down onto the ground to give it a red glow...
	const glow = new Three.SpotLight(RED, 1.5, 3, 1, 0.8);
	glow.position.z = 0;
	glow.position.y = -0.2;
	glow.position.x = 0;
	glow.target.position.set(0, -5, 0);
	glow.target.updateMatrixWorld();
	heart.add(glow);
	heart.add(glow.target);

	// ... the second spotlight points to the left...
	const lglow = new Three.SpotLight(RED, 0.3, 10, 1, 0.8);
	lglow.position.z = 0;
	lglow.position.y = 0;
	lglow.position.x = -0.25;
	lglow.target.position.set(-5, 0, 0);
	lglow.target.updateMatrixWorld();
	heart.add(lglow);
	heart.add(lglow.target);

	// ... and the last one to the right.
	const rglow = new Three.SpotLight(RED, 0.3, 10, 1, 0.8);
	rglow.position.z = 0;
	rglow.position.y = 0;
	rglow.position.x = 0.25;
	rglow.target.position.set(5, 0, 0);
	rglow.target.updateMatrixWorld();
	heart.add(rglow);
	heart.add(rglow.target);

	// Finally we want to load in our actual model. This model was created using
	// Blender since the geometry is a bit complex to encode here.
	const gltfLoader = new GLTFLoader();
	gltfLoader.load(
		"/images/pop.heart.model.glb",
		(gltf) => {
			// The scene as imported from the Blender export includes a light
			// and camera object, and then our model. All we need is the model
			const heartGeo = gltf.scene.children[2];
			heartGeo.scale.x = heartGeo.scale.x * 0.4;
			heartGeo.scale.y = heartGeo.scale.y * 0.4;
			heartGeo.scale.z = heartGeo.scale.z * 0.4;
			heartGeo.material = material;
			heart.add(heartGeo);
		},
		() => {},
		(err) => {
			console.log(err);
		}
	);
}

/**
 * Create an individual building and all related geometry.
 *
 * Because we have a "street", we want to construct buildings on either side of
 * it. Additionally, we want to mirror other things like our streetlights. This
 * is a simple helper to create all the pieces on either the left or right side
 * of the street, and mirror the things so we have symmetry. But also, we don't
 * want too much symmetry otherwise it will look weird, so the building's
 * height is determined randomly between our min and max.
 *
 * @param {number} z Z position for the model
 * @param {boolean} isLeft If we should draw it on the left or the right
 * @returns {Array<Three.Mesh>}
 */
function createBuilding(z, isLeft) {
	// We want a random height so we have some variety in our buildings
	const height = MIN_BUILD_SIZE + Math.random() * MAX_BUILD_SIZE;
	const geometry = new Three.BoxGeometry(BUILD_WIDTH, height, BUILD_DEPTH);
	const material = new Three.MeshStandardMaterial({
		color: GRAY,
	});

	// Create our mesh and position it where we need it
	const building = new Three.Mesh(geometry, material);
	building.position.y = GRID_LEVEL + height / 2;
	building.position.x = STREET_WIDTH / (isLeft ? -2 : 2);
	building.position.z = z;
	building.castShadow = true;
	building.receiveShadow = true;

	// Give it a name so we can find it later
	building.name = "Building";

	// Add a streetlight
	//
	// We use a Icosahedron rather than a sphere to match the style of our
	// heart model. We also make it "emissive" to give the appearance that
	// it is glowing, at least as it moves past. But computationally it is
	// too expensive to make this many lights, especially since they don't
	// add much to the scene in practice.
	const bulbGeo = new Three.IcosahedronGeometry(0.15);
	const bulbMat = new Three.MeshStandardMaterial({
		color: WHITE,
		emissive: WHITE,
		emissiveIntensity: 1,
	});
	const bulb = new Three.Mesh(bulbGeo, bulbMat);
	bulb.position.y = 0.5;
	bulb.position.z = z;
	// Set the right or left position, but also offset it closer to the
	// street and mirror it.
	if (isLeft) {
		bulb.position.x = STREET_WIDTH / -2 + BUILD_WIDTH / 1.2;
	} else {
		bulb.position.x = STREET_WIDTH / 2 - BUILD_WIDTH / 1.2;
	}

	// For our light, we need a pole that extends to the ground so they
	// aren't just floating.
	const poleHeight = 0.5 - GROUND_LEVEL;
	const poleGeo = new Three.CylinderGeometry(0.05, 0.05, poleHeight, 6);
	const poleMat = new Three.MeshStandardMaterial({ color: DEEP_PURPLE });
	const pole = new Three.Mesh(poleGeo, poleMat);
	pole.position.y = GROUND_LEVEL + poleHeight - 0.65;
	pole.position.z = bulb.position.z;
	pole.position.x = bulb.position.x;

	return [building, bulb, pole];
}

/**
 * Add a pair of builings to the scene at a given position.
 *
 * @param {number} zPosition the z-depth to construct the buildings at
 * @returns {Array<Three.Mesh>} All geometry associated with the buildings
 */
function addBuildingPair(zPosition) {
	const group = [];

	// Create all of our building geometry and add it to our group
	group.push(...createBuilding(zPosition, true));
	group.push(...createBuilding(zPosition, false));

	// We also need to add our geomtery to the scene, so do that here
	group.forEach((geo) => {
		buildings.add(geo);
	});

	return group;
}

/**
 * Initialize all of our buildings into the scene
 */
function initBuildings() {
	// We want a group to make animating easier. Note: this is a global
	buildings = new Three.Group();
	// We also want an "ordered" list of building groups to make moving them
	// when they are off screen easier. This array will remain ordered from
	// [closest to the viewer, ... to furthest from the view]. We reorder this
	// as we move things around. (See `extendDrawDistance`)
	buildingStack = [];

	// Draw the number of buildings we need off until we reach our draw distance
	const buildingsToDraw = Math.ceil(DRAW_DISTANCE / BUILD_DEPTH) + 1;
	for (let b = 0; b < buildingsToDraw; b++) {
		buildingStack.push(addBuildingPair(-1 * b * BUILD_SPACE));
	}

	scene.add(buildings);
}

function init() {
	initScene();
	initCamera();

	initLights();
	initGround();
	initHeart();
	initBuildings();

	const renderScene = new RenderPass(scene, camera);

	const bloomPass = new UnrealBloomPass(
		new Three.Vector2(window.innerWidth, window.innerHeight),
		0.8, // str
		0.2, // rad
		0 // threshold
	);

	composer = new EffectComposer(renderer);
	composer.addPass(renderScene);
	composer.addPass(bloomPass);
}

/**
 * Cull any buildings that are now off screen and move them to the end
 */
function cullOffScreenBuildings() {
	// Keep track of buildings we're "removing" so we can recycle them.
	//
	// In an ideal world we would throw out the old buildings and create new
	// ones so we didn't "loop" the same section of street forever, but this
	// puts a lot of strain on the browser's garbage collector as it has to
	// clean up a lot of models while also rendering at 60fps. It's much more
	// stable and performant to just reuse them, and we have enough buildings
	// that it's not super noticeable. Plus, it's meant to be background so
	// performance is key as choppy rendering would be distracting.
	let removedBuildings = [];

	// Go through our sorted list of buildings and...
	while (buildingStack.length) {
		// ... grab the first set of buildings...
		const pairToRemove = buildingStack.shift();
		// ... check if they are off screen...
		const pos = buildings.localToWorld(pairToRemove[0].position);
		if (pos.z < BUILD_SPACE * 2) {
			// ... if they aren't, we're done since we maintain our sort...
			buildingStack.unshift(pairToRemove);
			break;
		}

		// ... otherwise recycle them
		removedBuildings.push(pairToRemove);
	}

	// Now we move all the buildings so we can reset our transform on the group
	// which makes animating it easier
	buildings.updateMatrix();
	buildingStack.forEach((pair) => {
		pair.forEach((bld) => {
			bld.position.z += buildings.position.z;
		});
	});
	buildings.position.z = 0;
	buildings.updateMatrix();

	// And finally, recycle our "removed" buildings by simpling moving them to
	// the end of our current street
	for (let p = 0; p < removedBuildings.length; p++) {
		const geos = removedBuildings[p];
		const moveTo = buildingStack.length
			? buildingStack[buildingStack.length - 1][0].position.z -
			  BUILD_SPACE
			: 0; // Check for case if we removed everything
		geos.forEach((geo) => {
			geo.position.z = moveTo;
		});
		buildingStack.push(geos);
	}
}

/**
 * Animate the scene by calculating any changes and rendering the frame
 */
function animate() {
	requestAnimationFrame(animate);

	// We want both the difference from the last render and the current clock
	// time since we use both in different ways
	const sinceLast = clock.getDelta();
	const now = clock.getElapsedTime();

	// Animate our heart...
	if (heart) {
		// ... by making it rotate back and forth
		heart.rotation.y =
			HEART_SWAY_AMOUNT * Math.sin(now / HEART_SWAY_ANIMATION_TIME);
		// ... and by making it hover up and down
		heart.position.y =
			HEART_FLOAT_AMOUNT * Math.sin(now / HEART_FLOAT_ANIMATION_TIME);
	}

	// Move our grid
	if (grid) {
		// To avoid creating a massive grid, or doing some shenanigans with
		// duplicating the grid to shuffle it back and forth, we simply take
		// advantage of the fact that the grid is a repeating pattern and we
		// only animate it's position within that pattern. Basically, the
		// viewer only ever sees the same portion of the grid, they just see
		// it animated in such a way that it looks like they are travelling
		// along it.
		grid.position.z = (now / TRAVEL_SPEED) % 10;
	}

	// Move our buildings
	if (buildings) {
		buildings.position.z += sinceLast * (1 / TRAVEL_SPEED);
		// Check to see if we have buildings currently being drawn off screen
		if (buildings.position.z > BUILD_SPACE * 2) {
			// If so, cull them and create some new ones
			cullOffScreenBuildings();
		}
	}

	// Animate the camera
	// To do this, we want to slowly "drift" towards where the mouse is since
	// we aren't giving the viewer direct control over the camera and viewport
	if (typeof cameraDriftToX !== "undefined") {
		camera.position.x +=
			(cameraDriftToX - camera.position.x) * CAMERA_MOVE_SPEED;
	}
	if (typeof cameraDriftToY !== "undefined") {
		camera.position.y +=
			(cameraDriftToY - camera.position.y) * CAMERA_MOVE_SPEED;
	}
	controls.update();

	// Render the updated scene
	composer.render();
}

//// EVENT LISTENERS

// Listen for a resize event so we can redraw the scene the correct size
window.addEventListener("resize", () => {
	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
	composer.setSize(width, height);
});

// Listen for a focus event so we know when we have been away. Browsers
// optimize rendering in tabs that aren't visible by simply rendering them at
// a much slower rate. If we switch back to the tab, there's a chance we
// haven't rendered in long enough that there are no buildings on screen.
// Therefore, when we recieve focus, we check immediately to see if we need to
// cull any buildings and rerender things.
window.addEventListener("focus", () => {
	// If we were away from the tab, we want to make sure we have buildings
	// when we come back
	cullOffScreenBuildings();
});

// On mousemove, we simply want to record the position of the mouse so we can
// drift the camera to that position over time. This is an inexpensive call
// due to us simply setting variables and letting the next render do the actual
// "drifting" part.
document.documentElement.addEventListener("mousemove", (ev) => {
	const width = window.innerWidth;
	const height = window.innerHeight;

	const horizPerc = 1 - ev.screenX / width;
	const vertPerc = 1 - ev.screenY / height;

	cameraDriftToX = horizPerc * 0.6 - 0.3;
	cameraDriftToY = vertPerc * 0.4 - 0.115;
});

// Zhu Li, do the thing
init();
animate();

// We have a bit of additional functionality we want for our page, relying on
// an IntersectionObserver to transition some things properly as folks scroll
if (IntersectionObserver) {
	const intrObs = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					// If we're on-screen, transition in...
					entry.target.classList.add("section__current");
					entry.target.classList.remove("section__offscreen");
				} else {
					// ... otherwise, transition out
					entry.target.classList.add("section__offscreen");
					entry.target.classList.remove("section__current");
				}
			});
		},
		{
			// Observe relative to the window viewport
			root: null,
			// Give us a bit of margin around our observer to catch elements we
			// currently have drawn off-screen
			rootMargin: "0px 480px",
			// Give a bit of a bufffer before we transition in our elements
			threshold: 0.1,
		}
	);

	// Setup grabs all the sections in the main element
	const sections = Array.from(document.querySelectorAll("main > section"));
	// ... marks each as something we should observe
	sections.forEach((el) => intrObs.observe(el));
	// ... and makes it so we don't have a horizontal scrollbar
	document.querySelector("main").classList.add("main__hide-offscreen");
}
