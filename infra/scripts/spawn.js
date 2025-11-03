import { spawn } from "node:child_process";

function npmBin() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function spawnCmd(cmd, args = [], opts = {}) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: true,
    ...opts,
  });

  child.on("error", (err) => {
    console.error(`\nInitializing error ${cmd}:`, err);
  });

  return child;
}

async function cleanServices() {
  return new Promise((resolve) => {
    console.log(`Finishing Services...`);
    const stop = spawnCmd(npmBin(), ["run", "services:stop"]);
    let resolved = false;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      return resolve();
    };

    const timeout = setTimeout(() => {
      console.warn(
        "⚠️ Timeout when attempting to shut down services, forcing termination.",
      );
      stop.kill("SIGKILL");
      finish();
    }, 60000); // 60 seg

    stop.on("exit", (code) => {
      if (code === 0) console.log("✅ Services successfully finished!");
      else console.error(`\n⚠️ Services finished with code ${code}`);

      finish();
    });
  });
}

export function runScript(script, options = {}) {
  const { cleanup, afterExit } = options;
  let cleanupCalled = false;

  const proc = spawnCmd(npmBin(), ["run", script]);

  async function handleCleanup() {
    if (cleanupCalled) return;
    cleanupCalled = true;

    if (cleanup) await cleanServices();
    if (afterExit) afterExit();
  }

  process.on("SIGINT", () => {
    console.log("\n🛑 Interrupted by SIGINT");
    proc.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Interrupted by SIGTERM");
    proc.kill("SIGTERM");
  });

  proc.on("exit", async (code) => {
    await handleCleanup();

    process.exit(code ?? 0);
  });

  return proc;
}
