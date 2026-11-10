"use strict";

const assert = require("assert");
const handler = require("./api/check");

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.body = obj;
      return this;
    },
  };
}

async function call(method, body) {
  const req = { method, body };
  const res = mockRes();
  await handler(req, res);
  return res;
}

async function run() {
  delete process.env.GROQ_API_KEY;

  const listing =
    "Applicants must be Nigerian undergraduates in Chemical Engineering.\n" +
    "A minimum CGPA of 3.5 on a 5.0 scale is required.\n" +
    "The essay should show community leadership and a clear internship goal.";
  const essay =
    "My name is Ada. I am a Chemical Engineering student at the University of Lagos. " +
    "Last year I led a campus clean-up club that organised monthly sanitation days for 80 students. " +
    "I want this internship so I can learn process safety in a plant setting.";

  const ok = await call("POST", { listingTitle: "SAMPLE internship", listingText: listing, essay });
  assert.strictEqual(ok.statusCode, 200, "demo score should return 200");
  assert.strictEqual(ok.body.demo, true, "demo flag must be true when no key is set");
  assert.ok(/demo/i.test(ok.body.overall_summary), "summary must say this is a demo");
  assert.ok(Array.isArray(ok.body.criteria) && ok.body.criteria.length >= 1, "criteria expected");
  assert.ok(ok.body.score && typeof ok.body.score.met === "number", "score object expected");
  assert.ok("readiness" in ok.body.score, "readiness expected");

  const leadership = ok.body.criteria.find((c) => /leadership|chemical|cgpa|internship/i.test(c.name));
  assert.ok(leadership, "mock should extract at least one listing line");

  const method = await call("GET", {});
  assert.strictEqual(method.statusCode, 405);

  const short = await call("POST", { listingText: listing, essay: "Too short." });
  assert.strictEqual(short.statusCode, 400);

  const missingListing = await call("POST", { essay });
  assert.strictEqual(missingListing.statusCode, 400);

  const scored = handler.computeScore([
    { status: "met" },
    { status: "partly" },
    { status: "missing" },
    { status: "not_stated" },
  ]);
  assert.strictEqual(scored.met, 1);
  assert.strictEqual(scored.partly, 1);
  assert.strictEqual(scored.missing, 1);
  assert.strictEqual(scored.not_stated, 1);
  assert.strictEqual(scored.readiness, 50);

  console.log("All local tests passed (demo mode, no API key).");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
