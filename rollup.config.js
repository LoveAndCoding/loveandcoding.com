import { nodeResolve } from "@rollup/plugin-node-resolve";
import { extname } from "path";
import prettier from "prettier";
import cpy from "rollup-plugin-cpy";
import html from "rollup-plugin-html2";
import smartAsset from "rollup-plugin-smart-asset";
import serve from "rollup-plugin-serve";
import styles from "rollup-plugin-styles";
import { minify } from "terser";

const smartAssetOpts = {
	url: "copy",
	extensions: [
		".svg",
		".gif",
		".png",
		".jpg",
		".glb",
		".woff",
		".woff2",
		".CUBE",
	],
	publicPath: "/assets/",
	assetsPath: "assets/",
};

// VERY HACKY
const excludeAssetsFromHTML = {
	[Symbol.iterator]: () => {
		return ["assets/*"][Symbol.iterator]();
	},
	has: (name) => {
		return !name || name.startsWith("assets/");
	},
};

const removeDuplicateCSSinJS = () => ({
	generateBundle(_, bundle) {
		delete bundle["3dstyles.js"];
	},
});

const namedAssets = () => ({
	generateBundle(_, bundle) {
		Object.entries(bundle).forEach(
			([name, item]) =>
				item.type === "asset" && !item.name && (item.name = name),
		);
	},
});

const prettifyOrMinifyCode = () => {
	const confFile = prettier.resolveConfigFile();
	const conf = confFile.then(prettier.resolveConfig);

	return {
		async renderChunk(code, item) {
			if (!item.fileName || item.fileName === "vendor.js") {
				// We just want to minify our vendor file
				const { code: minCode, map } = await minify(
					{
						"vendor.js": code,
					},
					{
						sourceMap: {
							filename: "vendor.js",
							url: "vendor.js.map",
						},
						toplevel: true,
					},
				);
				return { code: minCode, map };
			}

			if (code) {
				return {
					code: prettier.format(code, {
						...(await conf),
						filepath: item.fileName,
					}),
				};
			}
		},

		async generateBundle(_, bundle) {
			const items = Object.values(bundle);
			for (const item of items) {
				if (!item.fileName || item.fileName === "vendor.js") {
					continue;
				}

				const fileType = extname(item.fileName);

				if ([".html", ".css", ".js"].includes(fileType)) {
					const codeKey = "code" in item ? "code" : "source";
					item[codeKey] = prettier.format(item[codeKey], {
						...(await conf),
						filepath: item.fileName,
					});
				}
			}
		},
	};
};

const settings = {
	input: ["js/3ds.js", "css/3dstyles.css"],
	output: {
		assetFileNames: "[name][extname]",
		dir: "dist/",
		format: "esm",
		chunkFileNames: "[name].js",
		manualChunks: (id) => {
			if (id.includes("three") || id.includes("node_modules")) {
				return "vendor";
			}
		},
	},
	plugins: [
		nodeResolve(),
		styles({
			mode: ["extract", "3dstyles.css"],
			url: { hash: false, publicPath: "/assets/" },
		}),
		smartAsset(smartAssetOpts),
		cpy({
			files: "./node_modules/three/examples/js/libs/draco/gltf/*",
			dest: "dist/draco",
		}),
		removeDuplicateCSSinJS(),
		namedAssets(),
		html({
			entries: {
				"3ds": {
					type: "module",
				},
			},
			template: "template.html",
			fileName: "index.html",
			exclude: excludeAssetsFromHTML,
			minify: false,
		}),
		prettifyOrMinifyCode(),
	],
};

if (process.argv.includes("-s") || process.argv.includes("--serve")) {
	settings.plugins.push(serve("dist"));
}

export default settings;
