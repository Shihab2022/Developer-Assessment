/* Enhances docs/postman-collection.json:
 *  1. Collection-level Bearer auth (inherited by all requests)
 *  2. noauth overrides for public endpoints
 *  3. Test scripts on key requests that auto-set collection variables
 * Run: node _enhance_postman.js
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "docs", "postman-collection.json");
const collection = JSON.parse(fs.readFileSync(FILE, "utf8"));

// ---------- 1. Collection-level auth ----------
collection.auth = {
  type: "bearer",
  bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }],
};

const PUBLIC_ENDPOINTS = new Set([
  "Authentication/Register (Candidate)",
  "Authentication/Register (Recruiter)",
  "Authentication/Login",
  "Authentication/Refresh Token",
  "Payments/List Packages",
  "Payments/Success Callback",
  "Payments/Fail Callback",
  "Payments/Cancel Callback",
  "Payments/IPN Callback",
]);

// ---------- 2. Test scripts ----------
const scriptFor = {};
const setTokens = [
  "const body = pm.response.json();",
  "const d = (body && body.data) || {};",
  'if (d.accessToken) pm.collectionVariables.set("accessToken", d.accessToken);',
  'if (d.refreshToken) pm.collectionVariables.set("refreshToken", d.refreshToken);',
  'if (d.user && d.user.id) pm.collectionVariables.set("userId", d.user.id);',
];
scriptFor["Authentication/Register (Candidate)"] = [
  'pm.test("Registered successfully", () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));',
  ...setTokens,
];
scriptFor["Authentication/Register (Recruiter)"] = [
  'pm.test("Registered successfully", () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));',
  ...setTokens,
];
scriptFor["Authentication/Login"] = [
  'pm.test("Logged in successfully", () => pm.expect(pm.response.code).to.equal(200));',
  ...setTokens,
];
scriptFor["Authentication/Refresh Token"] = [
  "const body = pm.response.json();",
  "const d = (body && body.data) || {};",
  'if (d.accessToken) pm.collectionVariables.set("accessToken", d.accessToken);',
  'if (d.refreshToken) pm.collectionVariables.set("refreshToken", d.refreshToken);',
];
scriptFor["Companies/Create Company"] = [
  'pm.test("Company created", () => pm.expect(pm.response.code).to.equal(201));',
  'const d = pm.response.json().data || {};',
  'if (d.id) pm.collectionVariables.set("companyId", d.id);',
];
scriptFor["Problems/Create MCQ Problem"] = [
  'pm.test("Problem created", () => pm.expect(pm.response.code).to.equal(201));',
  'const d = pm.response.json().data || {};',
  'if (d.id) pm.collectionVariables.set("problemId", d.id);',
];
scriptFor["Problems/Create Coding Problem"] = [
  'pm.test("Problem created", () => pm.expect(pm.response.code).to.equal(201));',
  'const d = pm.response.json().data || {};',
  'if (d.id) pm.collectionVariables.set("problemId", d.id);',
];

scriptFor["Assessments/Create Assessment"] = [
  'pm.test("Assessment created", () => pm.expect(pm.response.code).to.equal(201));',
  'const d = pm.response.json().data || {};',
  'if (d.id) pm.collectionVariables.set("assessmentId", d.id);',
];
scriptFor["Invitations/Invite Candidates"] = [
  'pm.test("Invitations created", () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));',
  "const body = pm.response.json();",
  "const d = (body && body.data) || {};",
  "const inv = Array.isArray(d) ? d[0] : (d.invitations && d.invitations[0]) || d;",
  'if (inv && inv.id) pm.collectionVariables.set("invitationId", inv.id);',
];
scriptFor["Attempts/Start Attempt"] = [
  'pm.test("Attempt started", () => pm.expect(pm.response.code).to.equal(201));',
  'const d = pm.response.json().data || {};',
  'if (d.id) pm.collectionVariables.set("attemptId", d.id);',
];
scriptFor["Attempts/Save Answer"] = [
  'pm.test("Answer saved", () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));',
  'const d = pm.response.json().data || {};',
  'if (d.id) pm.collectionVariables.set("answerId", d.id);',
];
scriptFor["Submissions/Create Submission"] = [
  'pm.test("Submission created", () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));',
  'const d = pm.response.json().data || {};',
  'if (d.id) pm.collectionVariables.set("submissionId", d.id);',
];
scriptFor["Payments/Initiate Payment"] = [
  'pm.test("Payment initiated", () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));',
  "const body = pm.response.json();",
  "const d = (body && body.data) || {};",
  "const p = d.payment || d;",
  'if (p.id) pm.collectionVariables.set("paymentId", p.id);',
  'if (p.transactionId) pm.collectionVariables.set("transactionId", p.transactionId);',
  'if (d.gatewayUrl) console.log("Open gateway URL in browser:", d.gatewayUrl);',
];

const testScript = (lines) => ({
  listen: "test",
  script: { type: "text/javascript", exec: lines },
});

let patched = 0;
const walk = (items, folderName) => {
  for (const it of items) {
    if (it.item) {
      walk(it.item, it.name);
      continue;
    }
    const key = `${folderName}/${it.name}`;
    if (PUBLIC_ENDPOINTS.has(key)) {
      it.auth = { type: "noauth" };
      patched++;
    }
    const lines = scriptFor[key];
    if (lines) {
      it.event = [testScript(lines)];
      patched++;
    }
  }
};
walk(collection.item, undefined);

fs.writeFileSync(FILE, JSON.stringify(collection, null, 2) + "\n", "utf8");
console.log(`Patched ${patched} requests. Collection-level bearer auth added.`);
