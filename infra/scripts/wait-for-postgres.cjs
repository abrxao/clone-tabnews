const { exec } = require("node:child_process");
const readline = require("node:readline");

function writeLine(msg) {
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(msg);
}

function generateSpinner(iteration) {
  let loading = "              |";
  const dashIdx = iteration % (loading.length - 1);
  const spinner =
    loading.substring(0, dashIdx) +
    "-" +
    loading.substring(dashIdx + 1, loading.length);
  return spinner;
}

function checkPostgres(currentCount = 0) {
  exec("docker exec postgres-dev pg_isready --host localhost", (_, stdout) => {
    const nextCount = currentCount + 1;
    const isReady = stdout.includes("accepting connections");

    if (isReady) {
      writeLine("");
      writeLine("\n🟢 Postgres is ready and accepting connections!\n");
      return;
    }

    const spinner = generateSpinner(nextCount);
    const message = `🟠 Waiting for Postgres to accept connections |${spinner}`;
    writeLine(message);

    setTimeout(() => {
      checkPostgres(nextCount);
    }, 50);
  });
}

process.stdout.write("\n");
checkPostgres(0);
