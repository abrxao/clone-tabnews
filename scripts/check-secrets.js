const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const PATTERNS = [
  // AWS
  /AKIA[0-9A-Z]{16}/,
  /aws[_-]?secret[_-]?access[_-]?key[\s]*=[\s]*["']?[A-Za-z0-9/+]{40}["']?/i,

  // Stripe
  /sk_live_[0-9a-zA-Z]{24}/,
  /rk_live_[0-9a-zA-Z]{24}/,

  // GitHub
  /ghp_[0-9a-zA-Z]{36}/,
  /github_pat_[0-9a-zA-Z]{22}_[0-9a-zA-Z]{59}/,

  // Generic API keys
  /["']?(api[_-]?key|secret[_-]?key|password|token)["']?\s*[:=]\s*["']([^"']{12,})["']/i,

  // JWT Base64 encoded (rough pattern)
  /eyJ[a-zA-Z0-9]{10,}\.eyJ[a-zA-Z0-9]{10,}\.[a-zA-Z0-9_-]{10,}/,

  // Database URLs with passwords
  /(postgres|mysql|mongodb)(\+srv)?:\/\/[^:]+:([^@]+)@/i,

  // Private keys
  /-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/,
];

const IGNORED_FILES = [
  "package-lock.json",
  "yarn.lock",
  "scripts/check-secrets.js",
  ".secrets.baseline",
];

const SCANNED_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".env",
  ".yml",
  ".yaml",
  ".xml",
  ".properties",
  ".config",
  ".conf",
  ".txt",
  ".md",
];

function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf8",
    });
    return output
      .split("\n")
      .filter((file) => file.trim())
      .filter(
        (file) => !IGNORED_FILES.some((ignored) => file.includes(ignored)),
      )
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return SCANNED_EXTENSIONS.includes(ext);
      });
  } catch (error) {
    console.error("❌ Error getting staged files:", error.message);
    process.exit(1);
  }
}

function getAllFiles() {
  const allFiles = [];
  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (file === "node_modules" || file === ".git" || file === ".husky") {
          continue;
        }
        walk(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (SCANNED_EXTENSIONS.includes(ext) || !ext) {
          const relativePath = path.relative(process.cwd(), filePath);
          if (
            !IGNORED_FILES.some((ignored) => relativePath.includes(ignored))
          ) {
            allFiles.push(relativePath);
          }
        }
      }
    }
  }
  walk(process.cwd());
  return allFiles;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  let foundSecrets = [];

  lines.forEach((line, index) => {
    PATTERNS.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          foundSecrets.push({
            file: filePath,
            line: index + 1,
            match: match,
            pattern: pattern.toString(),
          });
        });
      }
    });
  });

  return foundSecrets;
}

function main() {
  const args = process.argv.slice(2);
  let filesToCheck = [];

  if (args.includes("--files-from-stdin")) {
    const stdin = fs.readFileSync(0, "utf8");
    filesToCheck = stdin
      .split("\n")
      .filter((file) => file.trim())
      .filter(
        (file) => !IGNORED_FILES.some((ignored) => file.includes(ignored)),
      )
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return SCANNED_EXTENSIONS.includes(ext) || !ext;
      });
  } else if (args.includes("--all")) {
    console.log("🔍 Checking all files...");
    filesToCheck = getAllFiles();
  } else {
    console.log("🔍 Checking staged files...");
    filesToCheck = getStagedFiles();
  }

  if (filesToCheck.length === 0) {
    console.log("✅ No files to check.");
    return;
  }

  let secretsFound = [];

  filesToCheck.forEach((file) => {
    if (fs.existsSync(file)) {
      const secrets = checkFile(file);
      secretsFound = secretsFound.concat(secrets);
    }
  });

  if (secretsFound.length > 0) {
    console.error("🚨 Secret keys found:");
    secretsFound.forEach((secret) => {
      console.error(`   File: ${secret.file}:${secret.line}`);
      console.error(`   Snippet: ${secret.match}`);
      console.error(`   Pattern: ${secret.pattern}`);
      console.error("   ---");
    });
    console.error("\n❌ Commit blocked due to detection of secret keys.");
    process.exit(1);
  } else {
    console.log("✅ No secret keys detected. Commit allowed.");
  }
}

main();
