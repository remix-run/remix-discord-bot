const path = require("path");
const fs = require("fs");
require("@remix-run/node/globals").installGlobals();

let existingBuildInfo = {};
try {
  // eslint-disable-next-line import/extensions
  existingBuildInfo = require("../build-info.json");
} catch {
  // ignore
}

const commit = process.env.COMMIT_SHA;

async function getCommit() {
  if (!commit) return;
  try {
    const data = await fetch(
      `https://api.github.com/repos/remix-run/remix-discord-bot/commits/${commit}`
    ).then((res) => res.json());
    return {
      isDeployCommit: commit === "HEAD" ? "Unknown" : true,
      sha: data.sha,
      author: data.commit.author.name,
      date: data.commit.author.date,
      message: data.commit.message,
      link: data.html_url,
    };
  } catch (error) {
    return `Unable to get git commit info: ${error.message}`;
  }
}

const buildTime = Date.now();

async function go() {
  const buildInfo = {
    ...existingBuildInfo,
    buildTime,
    commit: {
      ...existingBuildInfo.commit,
      ...(await getCommit()),
    },
  };

  fs.writeFileSync(
    path.join(__dirname, "../public/build-info.json"),
    JSON.stringify(buildInfo, null, 2)
  );
}
go();
