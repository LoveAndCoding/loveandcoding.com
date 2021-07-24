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
	PointLightHelper,
	AmbientLight,
	DirectionalLight,
	DirectionalLightHelper,
	RectAreaLight,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper.js";
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

// Rendering variables
let camera, scene, renderer, controls, clock, composer, frame, nodePass, stats;
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
			x: -1.7,
			y: 2.5,
			z: 6,
		},
		target: {
			x: -1.7,
			y: 2.5,
			z: 0,
		},
		focalLength: 50,
	},
	{
		position: {
			x: 2.2,
			y: 3.2,
			z: 2.6,
		},
		target: {
			x: 2.2,
			y: 2.7,
			z: 0,
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

// Control variables
let driftingTo;
let darkMode = false;
const dayObjs = [];
const nightObjs = [];

// Animation Constants
const ANIMATION_TIME_IN_SECONDS = 1;

// Model/Drawing Constants
const DRAW_DISTANCE = 70;

// Colors
const WHITE = new Color(0, 0, 0);

/**
 * Initialize our Scene
 */
function initScene() {
	// Create our renderer with all the right fixings
	renderer = new WebGLRenderer({
		antialias: true,
		powerPreference: "high-performance",
	});
	renderer.setPixelRatio(window.devicePixelRatio * 4);
	renderer.setSize(window.innerWidth, window.innerHeight);

	renderer.gammaOutput = true;
	renderer.physicallyCorrectLights = true;

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = PCFSoftShadowMap;

	// We want to create a "clipping" container that can be used to clip any
	// excess content without causing a scrollbar. This is styled in the CSS
	const container = document.createElement("div");
	container.classList.add("animated-background");
	document.body.appendChild(container);
	container.appendChild(renderer.domElement);

	// Finally we create the scene, and add a bit of fog so we can't see the
	// hard edge when we reach the draw distance
	scene = new Scene();

	// We also want our background. We use a background instead of a skybox
	// because we have a limited viewpoint so we don't need the complexity
	// of wrapping our image into the 3D space.
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
	// A perspective camera is the best here since we want to be able to
	// "travel" down our street
	camera = new PerspectiveCamera(
		50,
		window.innerWidth / window.innerHeight,
		0.01,
		DRAW_DISTANCE,
	);

	// Orbit controls allow us to move the camera but keep it pointed at our
	// heart still, without having to do all the calculations ourselves
	controls = new OrbitControls(camera, renderer.domElement);

	// We want some nice defaults for pointing at the scene
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

	// Technically I don't believe these limits work with how we're using it,
	// but there's no harm in guardrails
	const vertCameraRange = Math.PI / 12;
	const horzCameraRange = Math.PI / 10;
	const halfPi = Math.PI / 2;
	/*
	controls.minPolarAngle = halfPi - vertCameraRange;
	controls.maxPolarAngle = halfPi + vertCameraRange;
	controls.minAzimuthAngle = -horzCameraRange;
	controls.maxAzimuthAngle = horzCameraRange;
	*/

	controls.update();
}

function initLights() {
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
			//light.shadow.bias = -0.0001;
			light.shadow.mapSize.width = 1024;
			light.shadow.mapSize.height = 1024;
		}
		scene.add(light);
		lights.set(lightSetup, light);
	}
}

function initRoom() {
	const dracoLoader = new DRACOLoader();
	// This is the output path from rollup
	dracoLoader.setDecoderPath("/draco/");

	const gltfLoader = new GLTFLoader();
	gltfLoader.setDRACOLoader(dracoLoader);
	gltfLoader.load(roomModel, (gltf) => {
		const root = gltf.scene;
		scene.add(root);

		root.traverse((obj) => {
			if (obj.isMesh) {
				if (!obj.name.includes("Floor")) obj.castShadow = true;
				obj.receiveShadow = true;
				obj.material.side = FrontSide;
				obj.material.roughness = 1;
			}
			if (
				obj.name.includes("Room_Light") ||
				obj.name === "Lamp_Orientation"
			) {
				obj.castShadow = true;
				if (obj.shadow) {
					obj.shadow.bias = -0.0001;
					obj.shadow.mapSize.width = 2048;
					obj.shadow.mapSize.height = 2048;
					obj.shadow.camera.far = 30;
				}
			} else if (
				obj.name === "Moonlight_Window" ||
				obj.name === "Sunlight_Window"
			) {
				const isNight = obj.name === "Moonlight_Window";
				const pos = new Vector3();
				obj.getWorldPosition(pos);
				const color = isNight ? 0x6e81a1 : WHITE;
				const intensity = isNight ? 1 : 4;
				const windowLight = new PointLight(color, intensity, 5);
				windowLight.position.set(pos.x - 0.2, pos.y, pos.z - 0.4);
				windowLight.castShadow = true;
				windowLight.shadow.bias = -0.0001;
				windowLight.shadow.mapSize.width = 2048;
				windowLight.shadow.mapSize.height = 2048;
				windowLight.shadow.camera.far = 10;
				(isNight ? nightObjs : dayObjs).push(windowLight);
				scene.add(windowLight);
			}
			console.log(obj);
		});

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
		windowBackdrop.mesh = backdrop;

		toTimeOfDay(true);
	});
}

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

	stats = new Stats();
	document.body.appendChild(stats.dom);
}

function moveCamera(to) {
	const { target, ...cameraTo } = to;
	startAnimation(camera, cameraTo);
	startAnimation(controls, { target });
}

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
	console.log(
		"Transition to",
		windowBackdrop.mesh,
		isDaytime ? windowBackdrop.daytimeColor : windowBackdrop.nighttimeColor,
	);
}

function getCurrentFrameAmount(from, to, percentageThroughAnimation) {
	if (Number.isNaN(from)) from = 0;
	return from + (to - from) * percentageThroughAnimation;
}

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

	advance(sinceLast) {
		if (!this.animating || !this.frameIterator) return false;

		const frame = this.frameIterator.next(sinceLast);
		return (this.animating = !frame.done);
	}

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

	start() {
		this.animating = true;
		this.timeRemaining = this.seconds;
		this.frameIterator = this.getFrames();
	}

	stop() {
		this.animating = false;
		this.timeRemaining = 0;
		return this.frameIterator.return(this.to);
	}
}

const animationMap = new Map();
let animating = false;
function startAnimation(item, to, seconds = ANIMATION_TIME_IN_SECONDS) {
	if (animationMap.has(item)) {
		animationMap.get(item).stop();
	}

	const anim = new Animation(item, to, seconds);
	animationMap.set(item, anim);

	if (animating) return;
	clock.getDelta();
	animating = true;
	requestAnimationFrame(animate);
}

/**
 * Animate the scene by calculating any changes and rendering the frame
 */
function animate() {
	if (!animationMap.size) {
		animating = false;
		return;
	}

	// We want both the difference from the last render and the current clock
	// time since we use both in different ways
	const sinceLast = clock.getDelta();

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
	stats.update();

	if (animationMap.size) {
		requestAnimationFrame(animate);
	} else {
		animating = false;
	}
	return;

	const percentAt =
		(ANIMATION_TIME_IN_SECONDS - animationTimeRemaining) /
		ANIMATION_TIME_IN_SECONDS;
	animationTimeRemaining = true; // Math.max(0, animationTimeRemaining - sinceLast);
	const moveAmount = Math.min(1, sinceLast / ANIMATION_TIME_IN_SECONDS);
	const percentMoveTo = Math.min(1, sinceLast / ANIMATION_TIME_IN_SECONDS);

	// Animate the camera
	// To do this, we want to slowly "drift" towards where the mouse is since
	// we aren't giving the viewer direct control over the camera and viewport
	if (driftingTo) {
		// Start at our current values
		const transform = {
			position: camera.position.clone(),
			target: controls.target.clone(),
			focalLength: camera.getFocalLength(),
		};
		const currFoc = camera.getFocalLength();
		const { x: cx, y: cy, z: cz } = camera.position;
		const { x: tx, y: ty, z: tz } = controls.target;

		const { x: dx, y: dy, z: dz } = driftingTo.position;
		const { x: dtx, y: dty, z: dtz } = driftingTo.target;

		const diffPosx = dx - cx;
		const diffPosy = dy - cy;
		const diffPosz = dz - cz;
		const diffTarx = dtx - tx;
		const diffTary = dty - ty;
		const diffTarz = dtz - tz;
		const diffFoc = driftingTo.focalLength - currFoc;

		camera.setFocalLength(currFoc + diffFoc * moveAmount);
		camera.position.set(
			Number.isNaN(cx) ? dx : cx + diffPosx * moveAmount,
			Number.isNaN(cy) ? dy : cy + diffPosy * moveAmount,
			Number.isNaN(cz) ? dz : cz + diffPosz * moveAmount,
		);
		controls.target.set(
			tx + diffTarx * moveAmount,
			ty + diffTary * moveAmount,
			tz + diffTarz * moveAmount,
		);
		controls.update();
	}

	// STOPSHIP: Debugging framerate is easier if we always are drawing
	if (!animationTimeRemaining) {
		animating = false;
	} else {
		requestAnimationFrame(animate);
	}
}

function toggleNightDay() {
	darkMode = !darkMode;
	toTimeOfDay(!darkMode);
}

function addNightModeButton() {
	const btn = document.createElement("button");
	let pressed = true;
	btn.setAttribute("aria-pressed", true);
	btn.type = "button";
	btn.addEventListener("click", () => {
		pressed = !pressed;
		if (pressed) {
			btn.setAttribute("aria-pressed", true);
		} else {
			btn.removeAttribute("aria-pressed");
		}
		toggleNightDay();
	});
	btn.id = "night-toggle-btn";
	const txt = document.createElement("span");
	txt.classList.add("screen-reader");
	txt.textContent = "Toggle Dark Mode";
	btn.appendChild(txt);
	document.body.appendChild(btn);
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

/*
// On mousemove, we simply want to record the position of the mouse so we can
// drift the camera to that position over time. This is an inexpensive call
// due to us simply setting variables and letting the next render do the actual
// "drifting" part.
document.documentElement.addEventListener("mousemove", (ev) => {
	const width = window.innerWidth;
	const height = window.innerHeight;

	const horizPerc = 1 - ev.screenX / width;
	const vertPerc = 1 - ev.screenY / height;

	cameraDriftToX = horizPerc * 0.7 - 0.3;
	cameraDriftToY = vertPerc * 0.3 - 0.115;
});
*/

// Zhu Li, do the thing
init();
addNightModeButton();

// We have a bit of additional functionality we want for our page, relying on
// an IntersectionObserver to transition some things properly as folks scroll
if (IntersectionObserver) {
	// Setup grabs all the sections in the main element
	const sections = Array.from(document.querySelectorAll("main > section"));
	// And appends the header to the front
	sections.unshift(document.querySelector("header"));

	const intrObs = new IntersectionObserver(
		(entries) => {
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
		},
	);

	// ... marks each as something we should observe
	sections.forEach((el) => intrObs.observe(el));
	// ... and makes it so we don't have a horizontal scrollbar
	document.querySelector("main").classList.add("main__hide-offscreen");
}
