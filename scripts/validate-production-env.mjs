const required = ["EVIDENCE_SIGNING_SECRET"];
const recommended = ["OPENAI_API_KEY", "OPENAI_MODEL", "APP_BASE_URL"];
const problems = [];

for (const name of required) {
  const value = process.env[name]?.trim();
  if (!value) problems.push(`${name} is missing.`);
}

const signingSecret = process.env.EVIDENCE_SIGNING_SECRET?.trim();
if (signingSecret && signingSecret.length < 32) {
  problems.push("EVIDENCE_SIGNING_SECRET must contain at least 32 characters.");
}

const baseUrl = process.env.APP_BASE_URL?.trim();
if (baseUrl) {
  try {
    const url = new URL(baseUrl);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      problems.push("APP_BASE_URL must use HTTPS in production.");
    }
  } catch {
    problems.push("APP_BASE_URL is not a valid absolute URL.");
  }
}

const status = Object.fromEntries(
  [...required, ...recommended].map((name) => [name, Boolean(process.env[name]?.trim())]),
);

console.log(JSON.stringify({ status, valid: problems.length === 0, problems }, null, 2));
if (problems.length > 0) process.exitCode = 1;
