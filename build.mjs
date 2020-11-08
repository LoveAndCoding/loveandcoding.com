/**
 * Build Script
 *
 * This is the custom build script built specifically for this site. It uses
 * the builds.json file to compile the site using different styles and js, but
 * (roughly) the same HTML for each. It creates as many versions of the site
 * as is defined in the configuration, and links them all to one another.
 *
 * Each style is composed of the following configuration options:
 *  - `icon` - filename for file in the images/hearts directory
 *  - `images` - Array of files in the images directory used for this style
 *  - `js` - Array of files in the js directory used to add interactivity
 *  - `label` - the user-friendly work to identify this style
 *  - `npmFonts` - font file configurations to include from NPM
 *  - `selfPotrait` - the style specific self portrait image
 *  - `slug` - a slug to use in the url and for identification
 *  - `stylesheet` - the stylesheet for the style
 *  - `themeColor` - a theme-color to set in the html for supported browsers
 *
 * On top of each style's unique configuration, there is also a set of defaults
 * that is common among many of the styles that the build will fall back on.
 *
 * This build script relies heavily on the pre-defined folder structure and the
 * goals of this site, and is therefore not likely to be widely applicable to
 * your code. But feel free to read through it and see how it all works. That
 * said, this is likely going to be less documented than other systems due to
 * it's specific and custom nature.
 *
 * NOTE ABOUT WHY CUSTOM ======================================================
 *
 * By this point, you probably thought to yourself "What?! Why did you roll
 * your own build script?!? Webpack is right there!" Which, true, it is. But I
 * chose to go this route for a few reasons.
 *
 * First, I'm looking for very specific options for my build configuration that
 * should be inserted in specific points in the template. This could be done by
 * loading in the builds.json file and generating the webpack config on demand,
 * but that can be a pain for some of the template options like the self
 * portrait which may have specific configuration that differs per style.
 *
 * Secondly, I am prioritizing a site that works staticly and without JS. While
 * it is certainly possible to get Webpack to support this, generally the
 * default assumption in Webpack is that you are building for a modern browser
 * site that relies heavily on JS. My site, by contrast, treats JS as additive
 * to the experience.
 *
 * Thirdly, I wanted control over a few additional aspects for some fun easter
 * eggs or other bits of specific and customized code. For example, all styles
 * include alternate stylesheets for each of the other styles in their HTML.
 * The benefit here being that, in some browsers, the user can switch between
 * styles without navigation. This is a lesser known feature of HTML/browsers,
 * but that's kind of the point. This is just about fun, so utilizing some of
 * those more obscure things to do fun experiments is a net positive.
 *
 * And finally, it's because this is a personal site showcasing my skills.
 * Libraries are great and I use a few throughout the site, but libraries
 * aren't always the right fit for every situation. And having made plenty of
 * build scripts over the course of my career, I knew I would be able to create
 * a script like this quickly, and with all the power I needed, without much
 * overhead.
 *
 * So for this particular use case, I felt it made more sense for me to build
 * rather than "buy".
 */
import { existsSync, promises as fs, watch } from "fs";
import { createServer } from "http";
import { basename, dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

import esprima from "esprima";
import finalHandler from "finalhandler";
import serveStatic from "serve-static";

// Because we're in an .mjs file, we don't have these automatically
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
//   - Directories
const NPM_DIR = join(__dirname, "node_modules");
const STYLE_DIR = join(__dirname, "css");
const JS_DIR = join(__dirname, "js");
const IMAGE_DIR = join(__dirname, "images");
const IMAGE_HEARTS_DIR = join(IMAGE_DIR, "hearts");
const BUILD_DIR = join(__dirname, "dist");
const BUILD_IMG_DIR = join(BUILD_DIR, "images");
const BUILD_IMG_HEARTS_DIR = join(BUILD_IMG_DIR, "hearts");
const BUILD_STYLE_DIR = join(BUILD_DIR, "css");
const BUILD_JS_DIR = join(BUILD_DIR, "js");
const BUILD_FONT_DIR = join(BUILD_DIR, "fonts");
//   - Files
const BUILD_CONFIG_FILE = join(__dirname, "builds.json");
const TEMPLATE_FILE = join(__dirname, "template.html");
const SHARED_CSS_FILE = join(STYLE_DIR, "love.css");
//   - Template Building Text
const HEADER_TABS = "\t".repeat(2);
const MENU_TABS = "\t".repeat(4);
const SCRIPT_TABS = "\t".repeat(3);

async function copyFromFolder(fromDir, toDir, list, jsFileIncludeDeps) {
	if (typeof list === "string" && list !== "") {
		// Probably just got single item to copy
		list = [list];
	} else {
		list = Array.from(list);
	}

	if (!list || !list.length) {
		return;
	}

	for (let i = 0; i < list.length; i++) {
		const item = list[i];
		const src = resolve(fromDir, item);
		const dest = resolve(toDir, item);
		if (existsSync(src) && !existsSync(dest)) {
			if (!existsSync(dirname(dest))) {
				await fs.mkdir(dirname(dest), { recursive: true });
			}
			await fs.copyFile(src, dest);

			// If we're a JS file, we want to parse out the dependencies so we
			// can copy those files over too. Note that because we add this to
			// our current processing list, we will grab dependencies of our
			// dependencies until we have everything.
			if (jsFileIncludeDeps) {
				try {
					list.push(...(await parseJSDeps(src)));
				} catch (err) {
					console.error(`Unable to parse deps for file ${item}`);
					console.error(err);
				}
			}
		}
	}
}

async function parseJSDeps(jsfile) {
	const deps = [];
	esprima.parseModule(
		await fs.readFile(jsfile, { encoding: "utf-8" }),
		{},
		(node, meta) => {
			if (node.type === "ImportDeclaration") {
				console.debug(
					`Found import in JS, adding to scripts`,
					relative(
						JS_DIR,
						resolve(dirname(jsfile), node.source.value)
					)
				);
				deps.push(
					"./" +
						relative(
							JS_DIR,
							resolve(dirname(jsfile), node.source.value)
						)
				);
			}
		}
	);

	return deps;
}

async function copyDependencies(build) {
	await fs.copyFile(
		join(IMAGE_HEARTS_DIR, build.icon),
		join(BUILD_IMG_HEARTS_DIR, build.icon)
	);
	await fs.copyFile(
		join(STYLE_DIR, build.stylesheet),
		join(BUILD_STYLE_DIR, build.stylesheet)
	);

	copyFromFolder(JS_DIR, BUILD_JS_DIR, build.js, true);

	copyFromFolder(IMAGE_DIR, BUILD_IMG_DIR, build.images);
	copyFromFolder(IMAGE_DIR, BUILD_IMG_DIR, build.selfPotrait);

	if (build.npmFonts && build.npmFonts.length) {
		for (let f = 0; f < build.npmFonts.length; f++) {
			const font = build.npmFonts[f];
			const folderPath = resolve(NPM_DIR, font.package);
			const files = font.styles.map((stl) => `${font.filePrefix}${stl}`);

			for (let s = 0; s < files.length; s++) {
				for (let e = 0; e < font.extensions.length; e++) {
					const file = `${files[s]}.${font.extensions[e]}`;
					const srcpath = resolve(folderPath, file);
					const destpath = resolve(BUILD_FONT_DIR, basename(file));

					if (existsSync(srcpath) && !existsSync(destpath)) {
						await fs.copyFile(srcpath, destpath);
					}
				}
			}
		}
	}
}

async function ensureFoldersExist(builds) {
	// Wipe the existing folder
	await fs.rmdir(BUILD_DIR, { recursive: true });

	// Make new blank folders
	await fs.mkdir(BUILD_IMG_HEARTS_DIR, { recursive: true });
	await fs.mkdir(BUILD_STYLE_DIR, { recursive: true });
	await fs.mkdir(BUILD_JS_DIR, { recursive: true });
	await fs.mkdir(BUILD_FONT_DIR, { recursive: true });

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
	return `${build.slug}/`;
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
	if (
		!(build.js && build.js.length) &&
		!(build.npmJs && build.npmJs.length)
	) {
		return "";
	}

	let scripts = "";
	if (build.npmJs && build.npmJs.length) {
		scripts +=
			build.npmJs
				.map(
					(js) =>
						`<script defer src="/js/${js}" type="module"></script>`
				)
				.join(`\n${SCRIPT_TABS}`) + `\n${SCRIPT_TABS}`;
	}

	if (build.js) {
		scripts += build.js
			.map(
				(js) => `<script defer src="/js/${js}" type="module"></script>`
			)
			.join(`\n${SCRIPT_TABS}`);
	}

	return scripts;
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
				`>\t${bld.label}</a>`,
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
	return `<meta name="theme-color" content="${build.themeColor}" />`;
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

	console.log("Rebuild complete");
}

function setupServer() {
	const serve = serveStatic(BUILD_DIR, { redirect: false });
	const server = createServer((req, res) => {
		serve(req, res, finalHandler(req, res));
	});

	server.listen(9001);
	console.log("Server started at localhost:9001");
}

function setupWatcher() {
	let rebuilding = false;
	const triggerRebuild = async () => {
		if (rebuilding) {
			return;
		}

		rebuilding = true;
		await rebuild();
		rebuilding = false;
	};
	watch(BUILD_CONFIG_FILE, triggerRebuild);
	watch(TEMPLATE_FILE, triggerRebuild);
	watch(JS_DIR, triggerRebuild);
	watch(STYLE_DIR, triggerRebuild);
}

await rebuild();
if (
	process.argv.length > 2 &&
	(process.argv.includes("--serve", 2) || process.argv.includes("-s", 2))
) {
	setupServer();
	setupWatcher();
}
