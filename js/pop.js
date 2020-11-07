import * as THREE from "./three/build/three.module.js";
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "./three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "./three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SubsurfaceScatteringShader } from "./three/examples/jsm/shaders/SubsurfaceScatteringShader.js";

let camera, scene, renderer, controls, clock;
let heart, composer, grid, buildings, buildingStack;
let cameraDriftToX, cameraDriftToY;

const HEART_SWAY_ANIMATION_TIME = 1.7; // 3 seconds
const HEART_FLOAT_ANIMATION_TIME = 0.8; // 3 seconds
const HEART_SWAY_AMOUNT = 0.2;
const HEART_FLOAT_AMOUNT = 0.03;
const TRAVEL_SPEED = 1 / 8; // We go 8 squares every 1 second
const CAMERA_MOVE_SPEED = 0.04;

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

init();
animate();

function initLights() {
	const color = WHITE;
	const intensity = 0.9;
	const dirLight = new THREE.DirectionalLight(color, intensity);
	dirLight.position.z = 1;
	dirLight.position.y = 2;
	dirLight.position.x = -1.5;
	scene.add(dirLight);
	scene.add(dirLight.target);

	dirLight.castShadow = true;

	const hemiLight = new THREE.HemisphereLight(DEEP_PURPLE, LIGHT_PURPLE, 2);
	hemiLight.position.set(0, 0, 0);
	scene.add(hemiLight);

	const ambientLight = new THREE.AmbientLight(WHITE, 0.3);
	scene.add(ambientLight);
}

function initShaders() {
	const loader = new THREE.TextureLoader();
	const imgTexture = loader.load("/images/scuffed-plastic-red.png");
	const thicknessTexture = loader.load(
		"/images/scuffed-plastic-thickness.png"
	);
	imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;

	const shader = SubsurfaceScatteringShader;
	const uniforms = THREE.UniformsUtils.clone(shader.uniforms);

	uniforms["map"].value = imgTexture;

	uniforms["diffuse"].value = new THREE.Vector3(1.0, 0.2, 0.2);
	uniforms["shininess"].value = 500;

	uniforms["thicknessMap"].value = thicknessTexture;
	uniforms["thicknessColor"].value = new THREE.Color(DEEP_RED);
	uniforms["thicknessDistortion"].value = 0.7;
	uniforms["thicknessAmbient"].value = 0.4;
	uniforms["thicknessAttenuation"].value = 0.8;
	uniforms["thicknessPower"].value = 4.0;
	uniforms["thicknessScale"].value = 10.0;

	var material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader,
		lights: true,
	});
	material.extensions.derivatives = true;

	return material;
}

function initHeart() {
	const material = initShaders();

	heart = new THREE.Group();
	scene.add(heart);

	const glow = new THREE.SpotLight(RED, 1.5, 3, 1, 0.8);
	glow.position.z = 0;
	glow.position.y = -0.2;
	glow.position.x = 0;
	glow.target.position.set(0, -5, 0);
	glow.target.updateMatrixWorld();
	heart.add(glow);
	heart.add(glow.target);

	const lglow = new THREE.SpotLight(RED, 0.4, 10, 1, 0.8);
	lglow.position.z = 0;
	lglow.position.y = 0;
	lglow.position.x = -0.25;
	lglow.target.position.set(-5, 0, 0);
	lglow.target.updateMatrixWorld();
	heart.add(lglow);
	heart.add(lglow.target);

	const rglow = new THREE.SpotLight(RED, 0.4, 10, 1, 0.8);
	rglow.position.z = 0;
	rglow.position.y = 0;
	rglow.position.x = 0.25;
	rglow.target.position.set(5, 0, 0);
	rglow.target.updateMatrixWorld();
	heart.add(rglow);
	heart.add(rglow.target);

	const gltfLoader = new GLTFLoader();
	gltfLoader.load(
		"/images/pop.heart.model.glb",
		(gltf) => {
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

function initGround() {
	const groundGeo = new THREE.PlaneBufferGeometry(
		DRAW_DISTANCE * 2,
		DRAW_DISTANCE * 2
	);
	const groundMat = new THREE.MeshStandardMaterial({ color: PURPLE });

	const ground = new THREE.Mesh(groundGeo, groundMat);
	ground.position.y = GROUND_LEVEL;
	ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;
	scene.add(ground);

	grid = new THREE.GridHelper(
		DRAW_DISTANCE * 2,
		DRAW_DISTANCE * 2,
		BLUE,
		BLUE
	);
	grid.position.y = GRID_LEVEL;
	grid.position.x = 0.5;
	ground.receiveShadow = true;
	scene.add(grid);
}

function createBuilding() {
	const height = MIN_BUILD_SIZE + Math.random() * MAX_BUILD_SIZE;
	const geometry = new THREE.BoxGeometry(BUILD_WIDTH, height, BUILD_DEPTH);
	const material = new THREE.MeshStandardMaterial({
		color: GRAY,
	});
	const cube = new THREE.Mesh(geometry, material);
	cube.castShadow = true;
	cube.receiveShadow = true;

	return [cube, height];
}

function addBuildingPair(zPosition) {
	const pair = [];
	for (let lr = 0; lr < 2; lr++) {
		let [bld, height] = createBuilding();
		bld.position.y = GRID_LEVEL + height / 2;
		bld.position.x = STREET_WIDTH / (lr % 2 ? -2 : 2);
		bld.position.z = zPosition;

		buildings.add(bld);
		pair.push(bld);

		// Add some lights; technically makes this not a pair, but we don't
		// assume two items in the list anywhere. We get as much geometery as
		// we want
		const bulbGeo = new THREE.SphereGeometry(0.15);
		const bulbMat = new THREE.MeshStandardMaterial({ color: WHITE });
		const bulb = new THREE.Mesh(bulbGeo, bulbMat);
		bulb.position.y = 0.5;
		bulb.position.z = zPosition + BUILD_DEPTH / 1.8;
		if (lr % 2) {
			bulb.position.x = STREET_WIDTH / -2 + BUILD_WIDTH / 1.2;
		} else {
			bulb.position.x = STREET_WIDTH / 2 - BUILD_WIDTH / 1.2;
		}

		buildings.add(bulb);
		pair.push(bulb);

		const poleHeight = 0.5 - GROUND_LEVEL;
		const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, poleHeight, 20);
		const poleMat = new THREE.MeshStandardMaterial({ color: DEEP_PURPLE });
		const pole = new THREE.Mesh(poleGeo, poleMat);
		pole.position.y = GROUND_LEVEL + poleHeight - 0.65;
		pole.position.z = bulb.position.z;
		pole.position.x = bulb.position.x;

		buildings.add(pole);
		pair.push(pole);
	}

	return pair;
}

function initBuildings() {
	buildings = new THREE.Group();
	buildingStack = [];

	const buildingsToDraw = Math.ceil(DRAW_DISTANCE / BUILD_DEPTH) + 1;
	for (let b = 0; b < buildingsToDraw; b++) {
		buildingStack.push(addBuildingPair(-1 * b * BUILD_SPACE));
	}

	scene.add(buildings);
}

function initCamera() {
	camera = new THREE.PerspectiveCamera(
		70,
		window.innerWidth / window.innerHeight,
		0.01,
		DRAW_DISTANCE
	);

	controls = new OrbitControls(camera, renderer.domElement);

	camera.position.y = 0.01;
	camera.position.z = 1.3;
	camera.rotation.x = -0.01;

	controls.enableDamping = true;
	controls.enablePan = false;
	controls.enableZoom = false;

	const vertCameraRange = Math.PI / 12;
	const horzCameraRange = Math.PI / 10;
	const halfPi = Math.PI / 2;
	controls.minPolarAngle = halfPi - vertCameraRange;
	controls.maxPolarAngle = halfPi + vertCameraRange;
	controls.minAzimuthAngle = -horzCameraRange;
	controls.maxAzimuthAngle = horzCameraRange;

	controls.update();
}

function initScene() {
	renderer = new THREE.WebGLRenderer({});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.toneMapping = THREE.CineonToneMapping;
	renderer.toneMappingExposure = Math.pow(0.82, 4.0);
	renderer.domElement.classList.add("animated-background");
	document.body.appendChild(renderer.domElement);

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(BLACK, 0.06);

	const loader = new THREE.TextureLoader();
	const bgTexture = loader.load("/images/pop.background.png");
	scene.background = bgTexture;

	clock = new THREE.Clock();
}

function init() {
	initScene();
	initCamera();

	initLights();
	initGround();
	initHeart();
	initBuildings();

	var renderScene = new RenderPass(scene, camera);

	const bloomPass = new UnrealBloomPass(
		new THREE.Vector2(window.innerWidth, window.innerHeight),
		1, // str
		0, // rad
		0 // threshold
	);

	composer = new EffectComposer(renderer);
	composer.addPass(renderScene);
	composer.addPass(bloomPass);
}

window.addEventListener("resize", () => {
	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
	composer.setSize(width, height);
});

document.documentElement.addEventListener("mousemove", (ev) => {
	const width = window.innerWidth;
	const height = window.innerHeight;

	const horizPerc = ev.screenX / width;
	const vertPerc = ev.screenY / height;

	cameraDriftToX = horizPerc * 0.6 - 0.3;
	cameraDriftToY = vertPerc * 0.4 - 0.115;
});

function extendDrawDistance() {
	// Because we use a trick with the floor to repeat the same section, we just
	// need to extend out the buildings
	let removedBuildings = 0;

	while (buildingStack.length) {
		const pairToRemove = buildingStack.shift();
		const pos = buildings.localToWorld(pairToRemove[0].position);
		if (pos.z < BUILD_SPACE * 2) {
			// We aren't looking at off-screen buildings anymore; break
			buildingStack.unshift(pairToRemove);
			break;
		}

		removedBuildings++;
		// Remove all the geometry from the group and scene
		pairToRemove.forEach((bld) => {
			buildings.remove(bld);
			scene.remove(bld);
		});
	}

	// Now we move all the buildings so we can reset our transform on the group
	buildings.updateMatrix();
	buildingStack.forEach((pair) => {
		pair.forEach((bld) => {
			bld.position.z += buildings.position.z;
		});
	});
	buildings.position.z = 0;
	buildings.updateMatrix();

	for (let p = 0; p < removedBuildings; p++) {
		const addAt = buildingStack.length
			? buildingStack[buildingStack.length - 1][0].position.z -
			  BUILD_SPACE
			: 0;
		buildingStack.push(addBuildingPair(addAt));
	}
}

function animate() {
	requestAnimationFrame(animate);

	const sinceLast = clock.getDelta();
	const now = clock.getElapsedTime();

	if (heart) {
		heart.rotation.y =
			HEART_SWAY_AMOUNT * Math.sin(now / HEART_SWAY_ANIMATION_TIME);
		heart.position.y =
			HEART_FLOAT_AMOUNT * Math.sin(now / HEART_FLOAT_ANIMATION_TIME);
	}

	if (grid) {
		grid.position.z = (now / TRAVEL_SPEED) % 10;
	}

	if (buildings) {
		buildings.position.z += sinceLast * (1 / TRAVEL_SPEED);
		if (buildings.position.z > BUILD_SPACE * 2) {
			// We have a building off-screen, extend the draw distance
			extendDrawDistance();
		}
	}

	if (typeof cameraDriftToX !== "undefined") {
		camera.position.x +=
			(cameraDriftToX - camera.position.x) * CAMERA_MOVE_SPEED;
	}
	if (typeof cameraDriftToY !== "undefined") {
		camera.position.y +=
			(cameraDriftToY - camera.position.y) * CAMERA_MOVE_SPEED;
	}
	controls.update();

	composer.render();
}
