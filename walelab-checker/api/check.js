"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const MAX_LISTING = 12000;
const MAX_ESSAY = 12000;

const SYSTEM_PROMPT = `You are the PathSync Application Readiness Checker. You help Nigerian university students practise application essays against a listing's stated selection criteria.

Rules:
1. Extract selection criteria only if they are clearly stated in the listing text. Do not invent criteria. Do not add common scholarship or internship criteria that the listing does not mention.
2. If the listing is vague, extract only what is actually written.
3. For each stated criterion, set status to "met", "partly", or "missing" based only on the student's essay.
4. evidence_quotes must be short verbatim quotes copied from the student's essay. If the essay has no supporting line, use an empty list. Never invent a quote. Never present a paraphrase as a quote.
5. Give concrete, practical revision suggestions. Do not rewrite the whole essay. A short example sentence is allowed when it would help.
6. Do not predict whether the student will be selected. Do not flatter. Be specific and fair.
7. Reply with a single JSON object only, matching this shape:
{
  "criteria": [
    {
      "name": "short name of the stated criterion",
      "stated_in_listing": true,
      "status": "met" | "partly" | "missing",
      "evidence_quotes": ["verbatim quote from the essay"],
      "rationale": "one or two sentences",
      "suggestion": "concrete revision advice, or an empty string if already met"
    }
  ],
  "overall_summary": "short guidance summary, not a selection prediction"
}`;

loadDotEnv();

function loadDotEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(status).json(obj);
  }
  if (typeof res.setHeader === "function") {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
  }
  res.end(body);
}

async function readBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string" && req.body.length) {
    return JSON.parse(req.body);
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

function clip(text, max) {
  const s = String(text || "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function normalizeStatus(value) {
  const s = String(value || "").toLowerCase().trim();
  if (s === "met" || s === "partly" || s === "missing" || s === "not_stated" || s === "not stated") {
    return s === "not stated" ? "not_stated" : s;
  }
  return "missing";
}

function computeScore(criteria) {
  let met = 0;
  let partly = 0;
  let missing = 0;
  let notStated = 0;
  for (const c of criteria) {
    if (c.status === "met") met += 1;
    else if (c.status === "partly") partly += 1;
    else if (c.status === "not_stated") notStated += 1;
    else missing += 1;
  }
  const scored = met + partly + missing;
  const readiness = scored === 0 ? null : Math.round((100 * (met + partly * 0.5)) / scored);
  return { met, partly, missing, not_stated: notStated, readiness };
}

function normalizeResult(raw, demo) {
  const incoming = Array.isArray(raw && raw.criteria) ? raw.criteria : [];
  const criteria = incoming.slice(0, 16).map((item, i) => {
    const quotes = Array.isArray(item && item.evidence_quotes)
      ? item.evidence_quotes.map((q) => String(q || "").trim()).filter(Boolean).slice(0, 3)
      : [];
    const stated = item && item.stated_in_listing === false ? false : true;
    let status = normalizeStatus(item && item.status);
    if (!stated) status = "not_stated";
    return {
      name: String((item && item.name) || "Criterion " + (i + 1)).trim().slice(0, 160),
      stated_in_listing: stated && status !== "not_stated",
      status,
      evidence_quotes: quotes,
      rationale: String((item && item.rationale) || "").trim().slice(0, 600),
      suggestion: String((item && item.suggestion) || "").trim().slice(0, 600),
    };
  });
  return {
    demo: Boolean(demo),
    overall_summary: String((raw && raw.overall_summary) || "").trim().slice(0, 1200),
    criteria,
    score: computeScore(criteria),
  };
}

function extractLooseCriteria(listingText) {
  const lines = String(listingText || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((l) => l.length >= 12 && l.length <= 240);
  const ranked = lines.filter((l) =>
    /must|should|require|looking for|criterion|criteria|eligibility|qualify|preferred|need to|demonstrat|experience|cgpa|gpa|year|level|skill|commit|essay|statement/i.test(l)
  );
  const picked = (ranked.length ? ranked : lines).slice(0, 6);
  if (picked.length) return picked;
  const compact = String(listingText || "").replace(/\s+/g, " ").trim();
  return compact ? [compact.slice(0, 180)] : ["Stated requirements in the listing"];
}

function mockCheck(listingText, essay) {
  const names = extractLooseCriteria(listingText);
  const essayLower = String(essay || "").toLowerCase();
  const criteria = names.map((name) => {
    const words = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 5);
    const hits = words.filter((w) => essayLower.includes(w));
    let status = "missing";
    if (words.length && hits.length >= Math.max(2, Math.ceil(words.length * 0.45))) status = "met";
    else if (hits.length) status = "partly";
    let quote = "";
    if (hits.length) {
      const sentences = String(essay || "").split(/(?<=[.!?])\s+/);
      const found = sentences.find((s) => s.toLowerCase().includes(hits[0]));
      if (found) quote = found.trim().slice(0, 220);
    }
    const suggestion =
      status === "met"
        ? ""
        : "Add a specific example that speaks to this stated criterion: " + name;
    return {
      name: name.slice(0, 160),
      stated_in_listing: true,
      status,
      evidence_quotes: quote ? [quote] : [],
      rationale:
        status === "missing"
          ? "Demo mode could not find a clear line in the essay for this stated criterion."
          : "Demo mode matched some words from this criterion in the essay. This is a rough check only.",
      suggestion,
    };
  });
  return normalizeResult(
    {
      criteria,
      overall_summary:
        "Demo response. No Groq API key is set, so this is not a real AI review. Use it to try the screens. Add GROQ_API_KEY for live feedback.",
    },
    true
  );
}

function parseModelJson(text) {
  let raw = String(text || "").trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The model did not return JSON.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

async function groqCheck(listingTitle, listingText, essay) {
  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const userPrompt =
    "Listing title: " +
    (listingTitle || "(none)") +
    "\n\nListing text:\n" +
    listingText +
    "\n\nStudent essay or personal statement:\n" +
    essay;

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      (payload && payload.error && payload.error.message) ||
      "Groq request failed (" + response.status + ").";
    const err = new Error(msg);
    err.status = response.status >= 400 && response.status < 600 ? response.status : 502;
    throw err;
  }
  const content =
    payload &&
    payload.choices &&
    payload.choices[0] &&
    payload.choices[0].message &&
    payload.choices[0].message.content;
  return normalizeResult(parseModelJson(content), false);
}

async function handler(req, res) {
  if (req.method === "OPTIONS") {
    if (typeof res.setHeader === "function") {
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    return send(res, 204, { ok: true });
  }
  if (req.method !== "POST") {
    return send(res, 405, { error: "Use POST." });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    return send(res, 400, { error: "Request body must be JSON." });
  }

  const listingTitle = clip(body && body.listingTitle, 200);
  const listingText = clip(body && body.listingText, MAX_LISTING);
  const essay = clip(body && body.essay, MAX_ESSAY);

  if (!listingText) {
    return send(res, 400, { error: "Paste or choose a listing first." });
  }
  if (!essay || essay.length < 40) {
    return send(res, 400, { error: "Paste an essay of at least 40 characters." });
  }

  try {
    if (!process.env.GROQ_API_KEY) {
      return send(res, 200, mockCheck(listingText, essay));
    }
    const result = await groqCheck(listingTitle, listingText, essay);
    return send(res, 200, result);
  } catch (err) {
    const status = err && err.status ? err.status : 502;
    return send(res, status, {
      error: (err && err.message) || "Scoring failed. Please try again.",
    });
  }
}

module.exports = handler;
module.exports.mockCheck = mockCheck;
module.exports.normalizeResult = normalizeResult;
module.exports.computeScore = computeScore;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/plain; charset=utf-8",
};

function startLocalServer() {
  const root = path.join(__dirname, "..");
  const port = Number(process.env.PORT || 3000);
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname === "/api/check") {
      return handler(req, res);
    }
    let filePath = path.normalize(path.join(root, url.pathname === "/" ? "index.html" : url.pathname));
    if (!filePath.startsWith(root)) {
      res.statusCode = 403;
      return res.end("Forbidden");
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.end("Not found");
      }
      res.setHeader("Content-Type", MIME[path.extname(filePath)] || "application/octet-stream");
      res.end(data);
    });
  });
  server.listen(port, () => {
    const mode = process.env.GROQ_API_KEY ? "Groq" : "demo mode (no GROQ_API_KEY)";
    console.log("PathSync Application Readiness Checker at http://localhost:" + port + " (" + mode + ")");
  });
}

if (require.main === module) {
  startLocalServer();
}
