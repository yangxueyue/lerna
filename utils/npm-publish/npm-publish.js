"use strict";

const fs = require("fs-extra");
const log = require("libnpm/log");
const publish = require("libnpm/publish");
const readJSON = require("libnpm/read-json");
const figgyPudding = require("figgy-pudding");
const runLifecycle = require("@lerna/run-lifecycle");

module.exports = npmPublish;

const PublishConfig = figgyPudding(
  {
    "dry-run": { default: false },
    dryRun: "dry-run",
    log: { default: log },
    "project-scope": {},
    projectScope: "project-scope",
    tag: { default: "latest" },
  },
  {
    other() {
      // open it up for the sake of tests
      return true;
    },
  }
);

function npmPublish(pkg, tarFilePath, _opts) {
  const opts = PublishConfig(_opts, {
    projectScope: pkg.name,
  });

  opts.log.verbose("publish", pkg.name);

  let chain = Promise.resolve();

  if (!opts.dryRun) {
    chain = chain.then(() => Promise.all([fs.readFile(tarFilePath), readJSON(pkg.manifestLocation)]));
    chain = chain.then(([tarData, manifest]) => publish(manifest, tarData, opts));
  }

  chain = chain.then(() => runLifecycle(pkg, "publish", opts));
  chain = chain.then(() => runLifecycle(pkg, "postpublish", opts));

  return chain;
}
