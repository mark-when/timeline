const { readFileSync, writeFileSync } = require("fs");
const { argv } = require("process");

function bump(which) {
  if (!["major", "minor", "patch"].includes(which)) {
    throw new Error(`${which} not one of 'major', 'minor', or 'patch`);
  }

  const pck = readFileSync("package.json", "utf-8");
  const pack = JSON.parse(pck);
  const version = pack.version;
  let [maj, min, pat] = version.split(".");

  if (which === "major") {
    maj = `${parseInt(maj) + 1}`;
  } else if (which === "minor") {
    min = `${parseInt(min) + 1}`;
  } else {
    pat = `${parseInt(pat) + 1}`;
  }

  const newVersion = `${maj}.${min}.${pat}`;
  pack.version = newVersion;

  writeFileSync("package.json", JSON.stringify(pack, null, 2));

  return newVersion;
}

bump(argv[2]);
