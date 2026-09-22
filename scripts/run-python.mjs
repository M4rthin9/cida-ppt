import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [script, ...args] = process.argv.slice(2);
if (!["import-frames.py", "make-frames.py"].includes(script)) {
  console.error("Choose import-frames.py or make-frames.py.");
  process.exit(1);
}

// Windows may expose a python3 Store alias despite a working python/py install.
const candidates = process.env.PYTHON
  ? [[process.env.PYTHON, []]]
  : process.platform === "win32"
    ? [
        ["python", []],
        ["py", ["-3"]],
        ["python3", []],
      ]
    : [
        ["python3", []],
        ["python", []],
      ];

const executable = candidates.find(([command, prefix]) => {
  const check = spawnSync(
    command,
    [...prefix, "-c", "import sys; sys.exit(sys.version_info < (3, 9))"],
    {
      stdio: "ignore",
      windowsHide: true,
      timeout: 10000,
    },
  );
  return check.status === 0;
});

if (!executable) {
  console.error("Python 3.9+ was not found. Install Python, or set PYTHON to its executable path.");
  process.exit(1);
}

const [command, prefix] = executable;
const result = spawnSync(
  command,
  [...prefix, fileURLToPath(new URL(script, import.meta.url)), ...args],
  {
    stdio: "inherit",
    windowsHide: true,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  },
);
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
