/**
 * Hi and welcome!
 *
 * This is where *all* the love gets injected into the site! Seriously, this
 * file does a lot of heavy lifting. But it makes things work how I want them
 * to, which is always good for code to do.
 *
 * Littered throughout this code is as many comments as I could find to put
 * in but I'm sure I missed some or something isn't clear. However I'm going
 * to do my best to make these comments like a bit of a tour guide showing
 * you around. That is to say, full of terrible jokes, useless information,
 * and generally is in the vicinity of more interesting things.
 *
 * I'll mark major sections with "Guide Post" so you know where to stop or
 * can just generally find your way around to the most interesting bits.
 */

/**
 * Guide Post 1 - ES2016
 *
 * You'll notice below that I use import statements to pull in all the various
 * bits of code (all built into a minified vendor file). At this point in time
 * most modern browsers support all the latest and fanciest JS functionality.
 *
 * That's why my code does not use babel, typescript, or any transpiler meant
 * to improve compatability. Much like what happened to jQuery years ago, the
 * tools are wonderful, but are maybe losing some of their appeal for certain
 * projects (like this one).
 *
 * Other than these imports and constants, my build scripts don't change any
 * pieces of code and leaves it exactly as is for you to look through. Warts
 * and all.
 */
import {
	// Renderer
	Clock,
	Scene,
	WebGLRenderer,
	// Camera
	PerspectiveCamera,
	// Models
	Color,
	FrontSide,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
	TextureLoader,
	Vector3,
	// Lighting
	HemisphereLight,
	PCFSoftShadowMap,
	PointLight,
	AmbientLight,
	DirectionalLight,
	RectAreaLight,
	MeshPhysicalMaterial,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import {
	NodeFrame,
	ScreenNode,
	FloatNode,
	ColorAdjustmentNode,
} from "three/examples/jsm/nodes/Nodes.js";
import { NodePass } from "three/examples/jsm/nodes/postprocessing/NodePass.js";

// Assets
import pinkBg from "../images/pink.bg.png";
import roomModel from "../images/room.glb";
import sunSvg from "../images/Sun.svg";
import moonSvg from "../images/Moon.svg";

/**
 * Guide Post 2 - Global Variables & Constants
 *
 * In a bigger project, I would avoid global variables and try to have better
 * encapsulation. But for this site, it was easy enough to avoid collisions
 * and this single file has any and all logic I need.
 *
 * For ease of development, I also have a few utility constants I've left in.
 * Most notably, I used the `cameraPositions` array to control all my camera
 * positioning in an easy to edit place. I do the same sort of thing with the
 * `windowBackdrop` and `lightsSetup` varaibles which are there just to have
 * an easy place for me to tweak values and play with how it all looked.
 */
// Rendering variables
let camera, scene, renderer, controls, clock, composer, frame, nodePass;
const cameraPositions = [
	{
		position: {
			x: 25,
			y: 18,
			z: 25,
		},
		target: {
			x: 0,
			y: 2.5,
			z: 0,
		},
		focalLength: 50,
	},
	{
		position: {
			x: 4,
			y: 2.3,
			z: -1.05,
		},
		target: {
			x: -4,
			y: 2.3,
			z: -1.05,
		},
		focalLength: 50,
	},
	{
		position: {
			x: -1.68,
			y: 2.5,
			z: 6,
		},
		target: {
			x: -1.68,
			y: 2.5,
			z: 0,
		},
		focalLength: 50,
	},
	{
		position: {
			x: 2.2,
			y: 3,
			z: 0,
		},
		target: {
			x: 2.2,
			y: 2.4,
			z: -2,
		},
		focalLength: 50,
	},
];
const windowBackdrop = {
	position: {
		x: 2.1,
		y: 2.5,
		z: -4.45,
	},
	rotation: {
		x: 0,
		y: 0,
		z: 0,
	},
	daytimeColor: new Color(235, 235, 235),
	nighttimeColor: new Color(0, 0, 0),
	width: 2.9,
	height: 2.9,
};
// Lighting variables
const lightsSetup = [
	/* Light 1 */
	{
		position: {
			x: -2,
			y: 5,
			z: -2.67,
		},
		shadows: false,
		daytime: {
			color: new Color(239, 226, 207),
			intensity: 0.015,
		},
		nighttime: {
			color: new Color(105, 111, 125),
			intensity: 0.005,
		},
		type: "Directional",
	},
	/* Light 2 */
	{
		position: {
			x: 26,
			y: 12.6,
			z: 4,
		},
		shadows: true,
		daytime: {
			color: new Color(235, 235, 235),
			intensity: 0.005,
		},
		nighttime: {
			color: new Color(59, 59, 39),
			intensity: 0.005,
		},
		type: "Directional",
	},
	/* Light 3 */
	{
		position: {
			x: 0,
			y: -50,
			z: 0,
		},
		daytime: {
			color: new Color(255, 238, 170),
			groundColor: new Color(23, 9, 0),
			intensity: 0.005,
		},
		nighttime: {
			color: new Color(75, 103, 194),
			groundColor: new Color(15, 6, 0),
			intensity: 0.002,
		},
		type: "Hemisphere",
	},
	/* Light 4 */
	{
		daytime: {
			color: new Color(41, 32, 41),
			intensity: 0.01,
		},
		nighttime: {
			color: new Color(36, 28, 36),
			intensity: 0.01,
		},
		type: "Ambient",
	},
	/* Light 5 */
	{
		position: {
			x: 2.1,
			y: 2.5,
			z: -4.4,
		},
		width: 2.9,
		height: 2.9,
		rotation: {
			x: Math.PI,
			y: 0,
			z: 0,
		},
		daytime: {
			color: new Color(190, 190, 217),
			intensity: 0.073,
		},
		nighttime: {
			color: new Color(64, 90, 198),
			intensity: 0.04,
		},
		type: "RectArea",
	},
	/* Light 6 */
	{
		position: {
			x: 4.03,
			y: 2.52,
			z: -3.52,
		},
		shadows: true,
		daytime: {
			color: new Color(219, 196, 126),
			intensity: 0.001,
		},
		nighttime: {
			color: new Color(181, 181, 117),
			intensity: 0.017,
		},
		skipAnimation: true,
		type: "Point",
	},
];
const lights = new Map();
let darkMode = false;

// Animation Constants
const ANIMATION_TIME_IN_SECONDS = 1;

// Model/Drawing Constants
const DRAW_DISTANCE = 70;

/**
 * Guide Post 3 - Three.js
 *
 * There's a number of rendering libraries out there for 3D, but three.js
 * definitely has a pretty big community at this point so it was an easy
 * choice for what to use. There also exist plenty of tutorials for how to
 * get things from Blender (where I did the modeling) to here.
 *
 * This isn't the first time I've worked with Three.js, but this was the
 * first time I really made it such a central part of a project. Even
 * beyond that, I'm still very new to 3D modeling and rendering in general
 * so this project was also a learning experience for me!
 *
 * While there is still things I wish looked better, I do think this all
 * turned out alright. I may continue to improve it, but for now I'm happy
 * with the results as they stand.
 */
/**
 * Initialize our Scene
 */
function initScene() {
	// Create our renderer with all the right fixings
	renderer = new WebGLRenderer({
		antialias: true,
		// We only render when animating, so using high performance
		// here shouldn't eat up folks' batteries too much.
		powerPreference: "high-performance",
	});
	// Draw at 2x dpr so we don't get as much aliasing. It's not a
	// complex scene so it doesn't cost too much to do this.
	renderer.setPixelRatio(window.devicePixelRatio * 2);
	renderer.setSize(window.innerWidth, window.innerHeight);

	// Tbh, I still don't quite get what this does, but it is better
	// with it on
	renderer.gammaOutput = true;
	// Our model, meshes, and lights need physicallyCorrectLights
	renderer.physicallyCorrectLights = true;

	// We need a map of the shadows so we can hunt them down with
	// our keyblades!
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = PCFSoftShadowMap;

	// We want to create a "clipping" container that can be used to clip any
	// excess content without causing a scrollbar. This is styled in the CSS
	const container = document.createElement("div");
	container.classList.add("animated-background");
	document.body.appendChild(container);
	container.appendChild(renderer.domElement);

	// Finally we create the scene
	scene = new Scene();

	// We also want our background. This mostly just works as a placeholder
	// image while we're loading in our scene, but also covers up any place
	// where our backdrop mesh might not cover
	const loader = new TextureLoader();
	const bgTexture = loader.load(pinkBg);
	scene.background = bgTexture;

	// When we've got our scene, we create (and auto-start) our rendering clock
	clock = new Clock();
}

/**
 * Initialize our camera for the scene
 */
function initCamera() {
	// A perspective camera gives us the right sort of viewpoint for
	// our scene
	camera = new PerspectiveCamera(
		50,
		window.innerWidth / window.innerHeight,
		0.01,
		DRAW_DISTANCE,
	);

	// Orbit controls allow us to move the camera and then point it at a
	// target spot instead of trying to calculate rotation values
	controls = new OrbitControls(camera, renderer.domElement);

	// We draw with the first camera position. If the viewer is already
	// partway down the page, we'll detect it below and animate it.
	camera.position.x = cameraPositions[0].position.x;
	camera.position.y = cameraPositions[0].position.y;
	camera.position.z = cameraPositions[0].position.z;
	camera.setFocalLength(cameraPositions[0].focalLength);
	controls.target.set(
		cameraPositions[0].target.x,
		cameraPositions[0].target.y,
		cameraPositions[0].target.z,
	);

	// The viewer doesn't have direct control of this since we want this in the
	// background of the site, so we disable controls here (as well as turning
	// off pointer interaction in CSS) to just make sure viewers can't mess
	// with the camera.
	controls.enabled = false;
	controls.enablePan = false;
	controls.enableZoom = false;

	controls.update();
}

/**
 * Guide Post 4 - Lighting
 *
 * Lighting is **difficult**! When you first start learning 3D rendering
 * (or photography or other mediums that use lights) most folks will tell
 * you that lighting is the hardest part to get right. At least that's
 * what I was told, and I have to agree.
 *
 * To be honest, the lighting still isn't what I'd like it to be. While I
 * think I got the model into a good state on Blender where it all looks
 * decent, I definitely feel it's lacking in the browser. I wasn't able
 * to figure out if it was the meshes, the parameters, or the lights that
 * were causing things to look so different between the two places, even
 * when I was using Eevee for rendering and importing the lights directly.
 *
 * But I got them to a good enough state, and used a few tricks to make
 * things more performant. To do this, I created an array of light
 * configurations (see the Constants Guide Post) and used that to slowly
 * add lights to scene one by one and adjust them all to get it to show
 * how I wanted it. I followed tutorials, read tricks, used the light
 * helpers, and finally got it to where it is now. And as I said, it's
 * not perfect, but that's ok.
 */
/**
 * Initialize our lights
 */
function initLights() {
	// Put in each light with the daytime settings to start with
	// since we start in 'light mode'
	for (const lightSetup of lightsSetup) {
		let light;
		switch (lightSetup.type) {
			case "Directional":
				light = new DirectionalLight(
					new Color(lightSetup.daytime.color),
					lightSetup.daytime.intensity,
				);
				break;
			case "Point":
				light = new PointLight(
					new Color(lightSetup.daytime.color),
					lightSetup.daytime.intensity,
				);
				break;
			case "Hemisphere":
				light = new HemisphereLight(
					lightSetup.daytime.color,
					lightSetup.daytime.groundColor,
					lightSetup.daytime.intensity,
				);
				break;
			case "Ambient":
				light = new AmbientLight(
					lightSetup.daytime.color,
					lightSetup.daytime.intensity,
				);
				break;
			case "RectArea":
				light = new RectAreaLight(
					lightSetup.daytime.color,
					lightSetup.daytime.intensity,
					lightSetup.width,
					lightSetup.height,
				);
				break;
		}

		if (lightSetup.position) {
			light.position.set(
				lightSetup.position.x,
				lightSetup.position.y,
				lightSetup.position.z,
			);
		}
		if (lightSetup.rotation) {
			light.rotation.set(
				lightSetup.rotation.x,
				lightSetup.rotation.y,
				lightSetup.rotation.z,
			);
		}
		if (lightSetup.shadows) {
			light.castShadow = true;
			// This was recommended in a few places as something that
			// can be used to improve shadows. However, this shadow
			// bias seemed to make my shadows less accurate, not more
			// so I ended up turning it off
			//
			// light.shadow.bias = -0.0001;
			light.shadow.mapSize.width = 1024;
			light.shadow.mapSize.height = 1024;
		}
		scene.add(light);
		lights.set(lightSetup, light);
	}
}

/**
 * Guide Post 5 - Blender & Modeling
 *
 * Other than the lights, the camera, and the backdrop outside the window,
 * everything that is rendered is loaded from a single scene that was
 * created in Blender (https://www.blender.org/). First, it is a much nicer
 * tool for 3D editing than doing it in code through Three.js, but also,
 * I actually bought and used a third-party library for most of the models
 * in the scene. The only model that I did myself was the heart, and it was
 * one of the first models I ever created in Blender.
 *
 * I created the heart by following a tutorial for creating a donut, if you
 * can imagine. The tutorial made me want donuts, but what I really wanted
 * to make was a heart, because my brand is all about love.
 *
 * Once I had all the pieces though, I built a little room that the viewer
 * could explore. All over the room are little things that are meant to be
 * pieces of my life represented in the site. There are lots of books, four
 * different pride flags, and a spot for our cat to lay. While this isn't
 * my actual office (that's far to messy to turn into a website), but
 * within it are pieces of me.
 *
 * Overall with compression, all of the models and textures for the scene
 * are smaller than the Three.js library itself. While the site isn't as
 * light-weight as I would like, it's also lighter than if I had simply
 * rendered these four camera angles as high-res screenshots and swapped
 * through them as background images.
 *
 * Low-poly models that I used were from this pack:
 * https://www.turbosquid.com/3d-models/3d-pack-interior-modular-1547648
 */
function initRoom() {
	// Draco is the compression/decompression loader for the models
	const dracoLoader = new DRACOLoader();
	// This is the output path from rollup, not the node_modules one
	dracoLoader.setDecoderPath("/draco/");

	// GLTF is our model format, though we specifically use a .gtlb file
	// as the binary file saves us a bit of space
	const gltfLoader = new GLTFLoader();
	gltfLoader.setDRACOLoader(dracoLoader);
	gltfLoader.load(roomModel, (gltf) => {
		const root = gltf.scene;
		scene.add(root);

		// Once we've got the scene loaded in, we want to go through and
		// do a bit of extra configuration for each of the items. This is
		// a fairly quick loop to just setup shadows and make sure we're
		// rendering only the front face of our models
		root.traverse((obj) => {
			if (obj.isMesh) {
				if (!obj.name.includes("Floor")) obj.castShadow = true;
				obj.receiveShadow = true;
				obj.material.side = FrontSide;
				obj.material.roughness = 1;
			}
		});

		// We create a backdrop to place outside the window so that it
		// actually looks like the window looks outside.
		//
		// This is done here in code rather than in Blender so that we
		// can transition it between night and day with the lighting.
		const backdropGeo = new PlaneGeometry(
			windowBackdrop.width,
			windowBackdrop.height,
		);
		const backdropMat = new MeshBasicMaterial({
			color: windowBackdrop.daytimeColor,
		});
		const backdrop = new Mesh(backdropGeo, backdropMat);
		backdrop.receiveShadow = true;
		backdrop.position.set(
			windowBackdrop.position.x,
			windowBackdrop.position.y,
			windowBackdrop.position.z,
		);
		backdrop.rotation.set(
			windowBackdrop.rotation.x,
			windowBackdrop.rotation.y,
			windowBackdrop.rotation.z,
		);
		scene.add(backdrop);
		// We stash the mesh in the global for easy access later.
		// Tbh, this was just an easy way to do this, even if it
		// is really ugly.
		//
		// If every pork chop were perfect , we wouldn't have hotdogs
		//  - Steven Universe
		windowBackdrop.mesh = backdrop;

		// Make sure we're showing the daytime to start
		toTimeOfDay(true);
	});
}

/**
 * Guide Post 6 - Shaders & Passes
 *
 * I understand shaders like I understand cars. I generally know how to
 * use one to do what I need, but if you ask me anything outside of that
 * I'm just going to give you a blank stare. But the few I've used here
 * have some specific purposes.
 *
 * I used a Depth of Field pass to just add a bit of a blur at the edges.
 * If I've done it well, you mostly won't notice it, but it's there to
 * hide anything off in the distance.
 *
 * I also used some simple color corrections to bring out some of the
 * colors and to compliment the lighting. The NodePass does the most
 * work here, adjusting things like vibrance and saturation to make
 * everything just a little more polished.
 */
function init() {
	initScene();
	initCamera();
	initLights();

	initRoom();

	const renderScene = new RenderPass(scene, camera);

	const gammaCorrection = new ShaderPass(GammaCorrectionShader);
	const dof = new BokehPass(scene, camera, {
		focus: 18,
		aperture: 0.00004,
		maxblur: 0.005,
	});

	frame = new NodeFrame();
	const screen = new ScreenNode();
	nodePass = new NodePass();

	const hue = new FloatNode();
	const sataturation = new FloatNode(0.95);
	const vibrance = new FloatNode(0.34);
	const brightness = new FloatNode(0);
	const contrast = new FloatNode(1.1);

	const hueNode = new ColorAdjustmentNode(
		screen,
		hue,
		ColorAdjustmentNode.HUE,
	);
	const satNode = new ColorAdjustmentNode(
		hueNode,
		sataturation,
		ColorAdjustmentNode.SATURATION,
	);
	const vibranceNode = new ColorAdjustmentNode(
		satNode,
		vibrance,
		ColorAdjustmentNode.VIBRANCE,
	);
	const brightnessNode = new ColorAdjustmentNode(
		vibranceNode,
		brightness,
		ColorAdjustmentNode.BRIGHTNESS,
	);
	const contrastNode = new ColorAdjustmentNode(
		brightnessNode,
		contrast,
		ColorAdjustmentNode.CONTRAST,
	);

	nodePass.input = contrastNode;

	composer = new EffectComposer(renderer);
	composer.addPass(renderScene);
	composer.addPass(gammaCorrection);
	composer.addPass(nodePass);
	composer.addPass(dof);
}

/**
 * Guide Post 7 - Animations
 *
 * I didn't do a lot of animations, but there are a few things I did to
 * help things flow a bit more. First was the animation of the camera as
 * you scroll through the page. This just moves us from place to place
 * and is a pretty simple transition.
 *
 * The other animation was animating the transition between 'light mode'
 * and 'dark mode' (or, rather, day and night). This one is just a bit
 * more complicated because each light has it's own configuration and we
 * also want to change the color of the "outside" to represent the change
 * in time.
 *
 * To do all of this, there are two main pieces that work in conjunction.
 *
 * First is the Animation class below. This is a general class to animate
 * properties and settings on a given item and advance through frames
 * based on the animation timing. To do this, we use a generator function
 * to apply the properties to the item and then yeild until we are drawing
 * our next frame. Animations can be done independent of one another, and
 * simultaneously, and they will simply calculate frames based on the
 * rendering speed.
 *
 * The second piece is the controller which starts new animations, calls
 * the generator for each animation to advance it a frame, and trigger
 * requestAnimationFrame so that we can draw the next frame. When there
 * are no animations to run, this does not continue to redraw the screen
 * and instead just let's the current image exist. Once an animation is
 * added, it runs that animation to completion, and if there are no more
 * simply waits for the next animation to be triggered.
 */
/**
 * Move the camera to the given location
 */
function moveCamera(to) {
	const { target, ...cameraTo } = to;
	startAnimation(camera, cameraTo);
	startAnimation(controls, { target });
}

/**
 * Transition the time of day to either daytime (true) or nighttime (false)
 */
function toTimeOfDay(isDaytime) {
	for (const ls of lightsSetup) {
		startAnimation(
			lights.get(ls),
			isDaytime ? ls.daytime : ls.nighttime,
			ls.skipAnimation ? 0 : ANIMATION_TIME_IN_SECONDS,
		);
	}

	const color = isDaytime
		? windowBackdrop.daytimeColor
		: windowBackdrop.nighttimeColor;
	windowBackdrop.mesh.material.color.setRGB(color.r, color.g, color.b);
}

/**
 * This is a very very basic function to linearly calculate the precentage
 * transition between two values.
 *
 * I split this into it's own function both because I do think in a bunch
 * of places, but also in case I wanted to make it non-linear at some point
 * and add something like friction or spring to things. But, alas, earwax
 * flavor again.
 */
function getCurrentFrameAmount(from, to, percentageThroughAnimation) {
	if (Number.isNaN(from)) from = 0;
	return from + (to - from) * percentageThroughAnimation;
}

/**
 * Animation
 *
 * Represents a single animation on a given item and is used to calculate
 * each frame from start to finish. It can also be used to stop a given
 * animation at any point.
 */
class Animation {
	constructor(item, to, seconds = ANIMATION_TIME_IN_SECONDS) {
		this.item = item;
		this.from = {};
		Object.keys(to).forEach((key) => (this.from[key] = item[key]));
		this.to = to;
		this.seconds = seconds;
		this.animating = false;

		this.frameIterator = this.getFrames();
	}

	/**
	 * Advances to the next frame
	 */
	advance(sinceLast) {
		if (!this.animating || !this.frameIterator) return false;

		const frame = this.frameIterator.next(sinceLast);
		return (this.animating = !frame.done);
	}

	/**
	 * Apply each of the properties we're animating to the item
	 */
	applyProperties(percentThrough) {
		for (const key of Object.keys(this.to)) {
			if (
				typeof this.item[key] === "undefined" ||
				this.item[key] === null
			) {
				continue;
			}
			if (
				this.item[key] instanceof Color &&
				"r" in this.to[key] &&
				"g" in this.to[key] &&
				"b" in this.to[key]
			) {
				this.item[key].setRGB(
					getCurrentFrameAmount(
						this.from[key].r,
						this.to[key].r,
						percentThrough,
					),
					getCurrentFrameAmount(
						this.from[key].g,
						this.to[key].g,
						percentThrough,
					),
					getCurrentFrameAmount(
						this.from[key].b,
						this.to[key].b,
						percentThrough,
					),
				);
			} else if (
				this.item[key].set &&
				"x" in this.to[key] &&
				"y" in this.to[key] &&
				"z" in this.to[key]
			) {
				this.item[key].set(
					getCurrentFrameAmount(
						this.from[key].x,
						this.to[key].x,
						percentThrough,
					),
					getCurrentFrameAmount(
						this.from[key].y,
						this.to[key].y,
						percentThrough,
					),
					getCurrentFrameAmount(
						this.from[key].z,
						this.to[key].z,
						percentThrough,
					),
				);
			} else {
				this.item[key] = getCurrentFrameAmount(
					this.from[key],
					this.to[key],
					percentThrough,
				);
			}
		}
	}

	/**
	 * Generator Function
	 * Used to get each of the frames as we're animating, apply the
	 * properties for the animation, and end the animation once we've
	 * animated for the time that we're supposed to.
	 */
	*getFrames() {
		const current = Object.assign({}, this.from);
		while (this.timeRemaining > 0) {
			const sinceLast = yield current;
			this.timeRemaining -= sinceLast;
			if (this.timeRemaining <= 0) {
				break;
			}
			const percentThrough =
				(this.seconds - this.timeRemaining) / this.seconds;
			this.applyProperties(percentThrough);
		}
		this.applyProperties(1);
		return this.to;
	}

	/**
	 * Starts the animation
	 */
	start() {
		this.animating = true;
		this.timeRemaining = this.seconds;
		this.frameIterator = this.getFrames();
	}

	/**
	 * Stops the animation and returns the end state
	 */
	stop() {
		this.animating = false;
		this.timeRemaining = 0;
		return this.frameIterator.return(this.to);
	}
}

/**
 * Triggers an animation to start
 */
const animationMap = new Map();
let animating = false;
function startAnimation(item, to, seconds = ANIMATION_TIME_IN_SECONDS) {
	// If we're animating this item already, stop that animation
	if (animationMap.has(item)) {
		animationMap.get(item).stop();
	}

	// Add the animation to our list of animations
	const anim = new Animation(item, to, seconds);
	animationMap.set(item, anim);

	// If we're already in the animation loop, we don't need to do anything
	if (animating) return;
	// Else we need to kick off the animation loop
	clock.getDelta();
	animating = true;
	requestAnimationFrame(animate);
}

/**
 * Animate the scene by requesting animation frames and advancing animations
 */
function animate() {
	if (!animationMap.size) {
		animating = false;
		return;
	}

	// Get the time since we last rendered. For new animations this won't
	// really matter, but that's ok
	const sinceLast = clock.getDelta();

	// Go through each of the animations, start them if need be, and then
	// advance to the next frame.
	const animations = Array.from(animationMap.entries());
	for (const [item, anim] of animations) {
		if (!anim.animating) {
			anim.start();
		}
		const hasMore = anim.advance(sinceLast);
		if (!hasMore) {
			animationMap.delete(item);
		}
	}

	frame.update(sinceLast).updateNode(nodePass.material);

	// Render the updated scene
	controls.update();
	composer.render();

	// If we have more animations, get the next frame
	if (animationMap.size) {
		requestAnimationFrame(animate);
	} else {
		animating = false;
	}
}

/**
 * Guide Post 8 - What time is it?
 *
 * Dark mode is the latest internet sensation. And for the low low price
 * of $Free.99 it can be yours on this site to.
 *
 * Ok, but seriously, while the day/night cycle sort of acts as a light
 * and dark mode, it was really more just about playing with the dynamic
 * lighting capabilities to show the room in two different states.
 *
 * For this, I created a custom button that could be used to switch back
 * and forth, and tried to make it so that the style of it matched the
 * overall style of the site itself. This was easy enough in SVG, but
 * dynamically transitioning between the two and making it look nice was
 * another matter.
 *
 * So I actually create two separate SVGs. One for the day version, and
 * one for the night. I then edited that by hand to make the two function
 * similar enough that I could mash them together in code. Which is what
 * I do here.
 *
 * I request both SVG files to get the raw text, and then I do a bit of
 * Frankenstein cosplay to create my monster of an SVG. I pull the pieces
 * from each, and extract some of the properties and data, and then merge
 * them together into a single SVG image. I then animate those properties
 * to transition the button dynamically between the night and day styles.
 *
 * It's ugly as all-get-out, but it works! And, beyond that, it's pretty
 * cool if I do say so myself. In this case I can modify the original SVG
 * files themselves, and any changes there will be automatically pulled
 * in and animated as a part of the transition.
 *
 * I had some much fancier ideas for this night and day cycle, but for
 * now just decided to stick with this. There were originally going to
 * be some things like partial transitions between states on hover.
 */
/**
 * Time of Day Toggle Button
 */
function toggleNightDay() {
	darkMode = !darkMode;
	toTimeOfDay(!darkMode);
}

const SVG_NS = "http://www.w3.org/2000/svg";
/**
 * TimeOfDaySvg
 *
 * This is Frankenstein's monster. This class takes in two blocks of raw
 * SVG text and combines them into a single image that can transition
 * between the states.
 *
 * It's all extremely custom, so this can't be applied generally, but the
 * result is very smooth.
 */
class TimeOfDaySvg {
	/**
	 * Take in SVG text, render it, and extract the shared pieces
	 */
	static getSvgComponents(svgText) {
		const renderedSvg = document.createElementNS(SVG_NS, "svg");
		// Normally it's a very bad idea to try and parse SVG via regex, but
		// we happen to have a very known and tighly controlled set of data
		// so it's the easiest way for us to do what we want.
		const [_, svgInnerText] = svgText.match(/<svg [^>]+>(.+)<\/svg>/ims);
		renderedSvg.innerHTML = svgInnerText;

		// We only have 1 defs element
		const defs = renderedSvg.getElementsByTagName("defs")[0];
		// ... and 1 rect, which is our BG
		const bg = renderedSvg.getElementsByTagName("circle")[0];
		// ... but we have a few groups
		const groupEls = Array.from(renderedSvg.getElementsByTagName("g"));
		const groups = groupEls.reduce((gps, el) => {
			const id = el.getAttribute("id");
			gps[id] = el;
			return gps;
		}, {});

		const styles = {
			el: renderedSvg.getElementsByTagName("style")[0],
		};

		return {
			el: renderedSvg,
			defs,
			bg,
			groups,
			styles,
		};
	}

	/**
	 * Takes in the two SVG text blocks, and creates the image
	 */
	constructor(sunSvgText, moonSvgText) {
		this.svg = document.createElementNS(SVG_NS, "svg");
		this.svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
		this.svg.setAttributeNS(
			"xmlns",
			"xlink",
			"http://www.w3.org/1999/xlink",
		);
		this.svg.setAttribute("viewBox", "0 0 512 512");

		this.sun = TimeOfDaySvg.getSvgComponents(sunSvgText);
		this.moon = TimeOfDaySvg.getSvgComponents(moonSvgText);

		this._createCombinedSvg();
	}

	/**
	 * Once we've got all the components, we can cobble this all
	 * together into one image
	 */
	_createCombinedSvg() {
		// Clear out our SVG
		this.svg.innerHTML = "";
		// By default we set it to the daytime
		this.isDay = true;
		// Append the existing styles
		this.defs = this.sun.defs.cloneNode(true);
		this.svg.appendChild(this.defs);
		// Create some special styles
		const styles = document.createElementNS(SVG_NS, "style");
		styles.innerHTML = `
			*[class^="cls-"] {
				transition: fill 0.3s, opacity 0.5s;
			}
			#Sun, #Cloud_1, #Cloud_2 {
				transition: transform 0.3s;
				transform-origin: center;
				will-change: transform;
			}
			svg:active #Sun,
			svg:focus #Sun,
			svg:hover #Sun {
				transform: scale(1.3);
			}
			svg:active #Cloud_1,
			svg:focus #Cloud_1,
			svg:hover #Cloud_1 {
				transform: translate(20px, -20px);
			}
			svg:active #Cloud_2,
			svg:focus #Cloud_2,
			svg:hover #Cloud_2 {
				transform: translate(-10px, 20px);
			}
		`;
		this.defs.appendChild(styles);
		// Append our bgs, but hide the moon bg
		this.sunBg = this.sun.bg.cloneNode(true);
		this.sunBg.setAttribute(
			"style",
			"filter: drop-shadow(-4px 8px 8px rgba(0, 0, 0, 0.7))",
		);
		this.svg.appendChild(this.sunBg);
		// Append our sun
		this.sunMoonEl = this.sun.groups.Sun.cloneNode(true);
		this.svg.appendChild(this.sunMoonEl);
		// Append our clouds
		this.clouds = [
			this.sun.groups.Cloud_2.cloneNode(true),
			this.sun.groups.Cloud_1.cloneNode(true),
		];
		this.svg.appendChild(this.clouds[0]);
		this.svg.appendChild(this.clouds[1]);
	}

	/**
	 * Transition the combined SVG image to the "day" state
	 */
	changeToDay() {
		this.defs.appendChild(this.sun.styles.el);
		try {
			this.defs.removeChild(this.moon.styles.el);
		} catch (e) {}
	}

	/**
	 * Transition the combined SVG image to the "night" state
	 */
	changeToNight() {
		this.defs.appendChild(this.moon.styles.el);
		try {
			this.defs.removeChild(this.sun.styles.el);
		} catch (e) {}
	}
}

/**
 * Adds the Time of Day button to the page
 */
async function addNightModeButton() {
	const sunResp = await fetch(sunSvg);
	const moonResp = await fetch(moonSvg);

	if (!sunResp.ok || !moonResp.ok) {
		// If we don't have the icons, just bail
		return;
	}

	// We have our fancy buttons, let's use 'em
	const todBtn = document.createElement("button");
	let pressed = true;
	// Accessibility is important!!!!!!!!!
	todBtn.setAttribute("aria-pressed", pressed);
	todBtn.type = "button";

	const sunText = await sunResp.text();
	const moonText = await moonResp.text();

	const todSvg = new TimeOfDaySvg(sunText, moonText);
	todBtn.appendChild(todSvg.svg);
	todBtn.addEventListener("click", () => {
		pressed = !pressed;
		if (pressed) {
			todSvg.changeToDay();
			todBtn.setAttribute("aria-pressed", true);
		} else {
			todSvg.changeToNight();
			todBtn.removeAttribute("aria-pressed");
		}
		toggleNightDay();
	});
	todBtn.id = "night-toggle-btn";

	// Accessibility is still important!!!!!!!
	const txt = document.createElement("span");
	txt.classList.add("screen-reader");
	txt.textContent = "Toggle Dark Mode";
	todBtn.appendChild(txt);

	// And finally just add it to the page
	document.body.appendChild(todBtn);
}

/**
 * Guide Post 9 - IntersectionObserver
 *
 * In the days of yore, when you wanted to do something on scroll, you
 * had to either:
 *   1. Sit on a loop and query the current scroll
 *   2. Attach a bazillion events and debounce like a deflated bouncey castle
 *   3. Prevent scrolling and just do it yourself
 *
 * But no more! Here I use the IntersectionObserver, along with the css
 * scroll snapping to simply move the camera along it's track each time
 * the user goes to the next section. This not only allows us to simply
 * move from one camera position to the next, but also runs when the
 * page initializes which means we don't have to do anything fancy to
 * check the scroll position.
 *
 * Overall this is so much nicer than any of the old methods and, just
 * looking at how little code it is should tell a big story.
 */
function initScrollWatcher() {
	// Setup grabs all the sections in the main element
	const sections = Array.from(document.querySelectorAll("main > section"));
	// And appends the header to the front
	sections.unshift(document.querySelector("header"));

	const intrObs = new IntersectionObserver(
		(entries) => {
			// Find the right camera position and go there
			for (let s = 0; s < sections.length; s++) {
				const section = sections[s];
				const isVisible = entries.some(
					(e) => e.isIntersecting && e.target === section,
				);
				if (isVisible && cameraPositions[s]) {
					moveCamera(cameraPositions[s]);
					break;
				}
			}
		},
		{
			// Observe relative to the window viewport
			root: null,
			// Give us a bit of margin around our observer to catch elements we
			// currently have drawn off-screen
			rootMargin: "0px 480px",
			// Give a bit of a bufffer before we transition in our elements
			threshold: 0.1,
		},
	);

	// ... marks each as something we should observe
	sections.forEach((el) => intrObs.observe(el));
	// ... and makes it so we don't have a horizontal scrollbar
	document.querySelector("main").classList.add("main__hide-offscreen");
}

// Listen for a resize event so we can redraw the scene the correct size
window.addEventListener("resize", () => {
	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
	composer.setSize(width, height);

	frame.updateNode(nodePass.material);

	// Render the updated scene
	controls.update();
	composer.render();
});

// Zhu Li, do the thing
init();
addNightModeButton();
initScrollWatcher();
