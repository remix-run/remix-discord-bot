if (process.env.NODE_ENV === "production") {
  import("./dist/index.js");
} else {
  const path = require("path");
  const chokidar = require("chokidar");
  require("dotenv/config");
  require("ts-node").register({
    scope: true,
    scopeDir: path.join(__dirname, "src"),
    pretty: true,
    transpileOnly: true,
    ignore: ["/node_modules/", "/__tests__/"],
    project: require.resolve("../tsconfig.json"),
  });
  const { ref } = require("./src");

  chokidar
    .watch(path.join(__dirname, "./src/**/*.ts"))
    .on("change", (changed) => {
      console.log(`File ${changed} has been changed`);
      ref.cleanup?.();
      for (let key in require.cache) {
        if (key.startsWith(path.join(__dirname, "./src"))) {
          delete require.cache[key];
        }
      }
      require("./src");
    });
}
