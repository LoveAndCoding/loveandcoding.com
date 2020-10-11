import { existsSync, promises as fs } from "fs";
import { basename, dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
//   - Directories
const STYLE_DIR = join(__dirname, "css");
const JS_DIR = join(__dirname, "js");
const IMAGE_DIR = join(__dirname, "images");
const IMAGE_HEARTS_DIR = join(IMAGE_DIR, "hearts");
const BUILD_DIR = join(__dirname, "dist");
const BUILD_IMG_DIR = join(BUILD_DIR, "images");
const BUILD_IMG_HEARTS_DIR = join(BUILD_IMG_DIR, "hearts");
const BUILD_STYLE_DIR = join(BUILD_DIR, "css");
const BUILD_JS_DIR = join(BUILD_DIR, "js");
//   - Files
const BUILD_CONFIG_FILE = join(__dirname, "builds.json");
const TEMPLATE_FILE = join(__dirname, "template.html");
const SHARED_CSS_FILE = join(STYLE_DIR, "love.css");
//   - Template Building Text
const HEADER_TABS = "\t".repeat(2);
const MENU_TABS = "\t".repeat(4);
const SCRIPT_TABS = "\t".repeat(3);

async function copyDependencies(build) {
	await fs.copyFile(
		join(IMAGE_HEARTS_DIR, build.icon),
		join(BUILD_IMG_HEARTS_DIR, build.icon)
	);
	await fs.copyFile(
		join(STYLE_DIR, build.stylesheet),
		join(BUILD_STYLE_DIR, build.stylesheet)
	);
	if (build.js && build.js.length) {
		for (let j = 0; j < build.js.length; j++) {
			await fs.copyFile(
				join(JS_DIR, build.js[j]),
				join(BUILD_JS_DIR, build.js[j])
			);
		}
	}

	if (build.images && build.images.length) {
		for (let i = 0; i < build.images.length; i++) {
			await fs.copyFile(
				join(IMAGE_DIR, build.images[i]),
				join(BUILD_IMG_DIR, build.images[i])
			);
		}
	}

	if (build.selfPotrait && !existsSync(join(IMAGE_DIR, build.selfPotrait))) {
		await fs.copyFile(
			join(IMAGE_DIR, build.selfPotrait),
			join(BUILD_IMG_DIR, build.selfPotrait)
		);
	}
}

async function ensureFoldersExist(builds) {
	// Wipe the existing folder
	await fs.rmdir(BUILD_DIR, { recursive: true });

	// Make new blank folders
	await fs.mkdir(BUILD_IMG_HEARTS_DIR, { recursive: true });
	await fs.mkdir(BUILD_STYLE_DIR, { recursive: true });
	await fs.mkdir(BUILD_JS_DIR, { recursive: true });

	// Make a folder for each build file that will need it
	for (let b = 0; b < builds.length; b++) {
		const bld = builds[b];
		if (bld.root) {
			continue;
		}

		await fs.mkdir(join(BUILD_DIR, bld.slug));
	}
}

function getUrl(build) {
	if (build.root) {
		return "";
	}
	return `${build.slug}.html`;
}

function getIconCSS(builds) {
	return builds
		.map((bld) =>
			[
				`#love-bar_${bld.slug} {`,
				`\tbackground-image: url("/images/hearts/${bld.icon}");`,
				"}",
			].join("\n")
		)
		.join("\n");
}

function getJSScripts(build) {
	if (!build.js || !build.js.length) {
		return "";
	}

	return build.js
		.map((js) => `<script defer src="/js/${js}"></script>`)
		.join(`\n${SCRIPT_TABS}`);
}

function getMenu(builds, selected) {
	return builds
		.map((bld) =>
			[
				`<a`,
				`\tclass="love-bar_link${
					bld === selected ? " love-bar_link__selected" : ""
				}"`,
				`\thref="/${getUrl(bld)}"`,
				`\tid="love-bar_${bld.slug}"`,
				">",
				`\t${bld.label}`,
				`</a>`,
			].join(`\n${MENU_TABS}`)
		)
		.join(`\n${MENU_TABS}`);
}

function getStylesheets(builds, selected) {
	return builds
		.map(
			(bld) =>
				`<link href="/css/${bld.stylesheet}" rel="${
					bld === selected ? "stylesheet" : "alternate stylesheet"
				}" title="${bld.label}" />`
		)
		.join(`\n${HEADER_TABS}`);
}

function getThemeColor(build) {
	return `<meta name="theme-color" content="#${build.themeColor}" />`;
}

async function grabFiles() {
	try {
		const template = await fs.readFile(TEMPLATE_FILE, {
			encoding: "utf-8",
		});

		// recreate builds variable
		let builds = JSON.parse(
			await fs.readFile(BUILD_CONFIG_FILE, { encoding: "utf-8" })
		);
		builds = builds.styles.map((bld) =>
			Object.assign({}, builds.defaults, bld)
		);

		return {
			builds,
			template,
		};
	} catch (err) {
		console.error(err.stack);
		return {};
	}
}

async function rebuild() {
	let { builds, template } = await grabFiles();
	if (!builds || !template) {
		console.log("Rebuild Failed!");
		return;
	}

	await ensureFoldersExist(builds);

	// For each build, we want to output an html file
	await Promise.all(
		builds.map(async (bld) => {
			let bldHTML = template;

			// Replace the theme color
			bldHTML = bldHTML.replace(
				"<!--% THEME COLOR %-->",
				getThemeColor(bld)
			);
			bldHTML = bldHTML.replace(
				"<!--% STYLESHEET INSERTS %-->",
				getStylesheets(builds, bld)
			);
			bldHTML = bldHTML.replace(
				"<!--% MENU ITEM INSERTS %-->",
				getMenu(builds, bld)
			);
			bldHTML = bldHTML.replace(
				"<!--% SCRIPT INSERTS %-->",
				getJSScripts(bld)
			);

			const bldFilename = resolve(
				BUILD_DIR,
				bld.root ? "." : bld.slug,
				"index.html"
			);

			await fs.writeFile(bldFilename, bldHTML);
			await copyDependencies(bld);
		})
	);

	// Copy over the common stylesheet
	let sharedCSS = await fs.readFile(SHARED_CSS_FILE, { encoding: "utf-8" });
	sharedCSS += "\n\n" + getIconCSS(builds);
	await fs.writeFile(
		join(BUILD_STYLE_DIR, basename(SHARED_CSS_FILE)),
		sharedCSS
	);
}

rebuild();
