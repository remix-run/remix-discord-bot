const fsExtra = require("fs-extra");
const path = require("path");
const glob = require("glob");
const pkg = require("../package.json");

const here = (...s) => path.join(__dirname, ...s);

const ignore = [
  "**/tsconfig.json",
  "**/eslint*",
  "**/__tests__/**",
  "**/playground.*",
];

const allFiles = glob.sync(here("../bot/src/**/*.*"), {
  ignore,
});

for (const file of allFiles) {
  if (!/\.(ts|js|tsx|jsx)$/.test(file)) {
    const dest = file.replace(here("../bot/src"), here("../bot/dist"));
    fsExtra.ensureDir(path.parse(dest).dir);
    fsExtra.copySync(file, dest);
    console.log(`copied: ${file.replace(`${here("../bot/src")}/`, "")}`);
  }
}

console.log();
console.log("building...");

fsExtra.removeSync(here("../bot/dist"));
fsExtra.ensureDirSync(here("../bot/dist"));
fsExtra.writeFileSync(here("../bot/dist/package.json"), '{"type": "module"}');

require("esbuild")
  .build({
    entryPoints: glob.sync(here("../bot/src/**/*.+(ts|js|tsx|jsx)"), {
      ignore,
    }),
    outdir: here("../bot/dist"),
    target: [`node${pkg.engines.node}`],
    platform: "node",
    format: "esm",
    logLevel: "info",
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
