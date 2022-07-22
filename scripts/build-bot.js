const fsExtra = require("fs-extra");
const path = require("path");
const glob = require("glob");
const pkg = require("../package.json");

const here = (...s) => path.join(__dirname, ...s);

console.log();
console.log("building...");

fsExtra.removeSync(here("../bot/dist"));

const filesToCopy = glob.sync(here("../bot/src/**/*.*"), {
  ignore: ["**/*.+(ts|js|tsx|jsx)", "**/tsconfig.json", "**/eslint*"],
});

for (const file of filesToCopy) {
  const dest = file.replace(here("../bot/src"), here("../bot/dist"));
  fsExtra.ensureDir(path.parse(dest).dir);
  fsExtra.copySync(file, dest);
  console.log(`copied: ${file.replace(`${here("../bot/src")}/`, "")}`);
}

require("esbuild").buildSync({
  entryPoints: [here("../bot/src/index.ts")],
  outfile: here("../bot/dist/index.js"),
  bundle: true,
  external: ["./node_modules/*", "./public/*"],
  target: [`node${pkg.engines.node}`],
  platform: "node",
  logLevel: "info",
});
