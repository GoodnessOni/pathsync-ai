const SAMPLE_LISTINGS = [
  {
    id: "sample-stem-scholarship",
    title: "SAMPLE: National STEM Undergraduate Scholarship",
    kind: "Scholarship",
    source: "Sample listing for demo only. Not a live opportunity.",
    text:
      "The National STEM Undergraduate Scholarship supports Nigerian citizens enrolled in a full-time undergraduate STEM programme (science, technology, engineering or mathematics) at an accredited Nigerian university.\n\n" +
      "Selection criteria stated in this call:\n" +
      "- Applicants must be Nigerian citizens.\n" +
      "- Applicants must be in 200 level or above in a STEM course.\n" +
      "- A minimum CGPA of 3.50 on a 5.00 scale is required. Do not convert from another scale.\n" +
      "- The personal statement (max 500 words) must explain a specific academic or community problem the applicant has worked on, and what they want to study next.\n" +
      "- Evidence of tutoring, laboratory work, or a student technical society role will be considered.\n" +
      "- Applications close 28 November 2026, 11:59 PM West Africa Time.\n\n" +
      "The committee will not consider statements that only repeat the applicant's CGPA without examples."
  },
  {
    id: "sample-process-internship",
    title: "SAMPLE: Process Engineering Internship, Port Harcourt",
    kind: "Internship",
    source: "Sample listing for demo only. Not a live opportunity.",
    text:
      "A six-month process engineering internship with a midstream operating company in Port Harcourt. This is a sample listing written for the PathSync checker demo.\n\n" +
      "Stated requirements:\n" +
      "- Undergraduate or recent graduate in Chemical Engineering, Petroleum Engineering, or Process Engineering.\n" +
      "- Completion of at least 300 level, or a recent B.Eng / B.Tech award.\n" +
      "- The application essay must describe one technical task the applicant has done (design calculation, lab, plant visit, or simulation) and what they learned from it.\n" +
      "- Safety awareness: mention any process safety, HSE, or laboratory safety training or practice.\n" +
      "- Availability to be in Port Harcourt for the full six months, starting January 2027.\n" +
      "- Comfortable working in a team. Give one example of group work, not a generic claim.\n\n" +
      "English is the working language. The essay should be at most 600 words."
  },
  {
    id: "sample-leadership-fellowship",
    title: "SAMPLE: Campus Leadership Fellowship",
    kind: "Fellowship",
    source: "Sample listing for demo only. Not a live opportunity.",
    text:
      "The Campus Leadership Fellowship is a one-year programme for student leaders in Nigerian public universities who want to improve a campus service or community project.\n\n" +
      "Stated selection criteria:\n" +
      "- Enrolment in a Nigerian public university for the 2026/2027 session.\n" +
      "- A record of leading a student group, class office, campus fellowship, or community project. Name the group and your role.\n" +
      "- The statement of purpose must describe one problem the applicant tried to fix, the steps they took, and what changed.\n" +
      "- A clear plan for how the fellowship time would be used, with a realistic campus audience.\n" +
      "- Applicants who have held paid student jobs or run a small campus enterprise may describe that work, but it is not required.\n\n" +
      "Do not submit a generic leadership essay. The reviewers will look for names, dates, and results."
  }
];

const SAMPLE_ESSAY =
  "My name is Tunde Adeyemi and I study Chemical Engineering at the University of Lagos. I am in 300 level. I work hard in my courses and I want to be a good engineer.\n\n" +
  "In my second year I joined the student chemical engineering society. I helped organise a departmental quiz and I sometimes explain topics to classmates before tests. I also took part in a laboratory session on fluid flow, where our group measured pressure drop in a pipe.\n\n" +
  "I want this opportunity because it will help my career and let me give back to my community. I am a team player, I am ready to learn, and I will be available if I am selected. Thank you for considering my application.";

const HISTORY_KEY = "pathsync-readiness-history-v1";

const $ = (id) => document.getElementById(id);

function listingOptions() {
  const select = $("listing-select");
  SAMPLE_LISTINGS.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.title;
    select.appendChild(opt);
  });
  const custom = document.createElement("option");
  custom.value = "custom";
  custom.textContent = "Paste your own listing text";
  select.appendChild(custom);
}

function currentListingId() {
  return $("listing-select").value;
}

function selectedSample() {
  const id = currentListingId();
  return SAMPLE_LISTINGS.find((item) => item.id === id) || null;
}

function listingPayload() {
  const sample = selectedSample();
  if (sample) {
    return { id: sample.id, title: sample.title, text: sample.text };
  }
  return {
    id: "custom",
    title: $("custom-title").value.trim() || "Pasted listing",
    text: $("custom-text").value.trim(),
  };
}

function syncListingUI() {
  const sample = selectedSample();
  $("sample-panel").hidden = !sample;
  $("custom-panel").hidden = Boolean(sample);
  if (sample) {
    $("sample-kind").textContent = sample.kind;
    $("sample-source").textContent = sample.source;
    $("sample-text").textContent = sample.text;
  }
  renderHistory();
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}") || {};
  } catch (err) {
    return {};
  }
}

function saveHistory(all) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
}

function listingHistory() {
  const all = loadHistory();
  return Array.isArray(all[listingPayload().id]) ? all[listingPayload().id] : [];
}

function pushHistory(score) {
  const all = loadHistory();
  const id = listingPayload().id;
  const list = Array.isArray(all[id]) ? all[id] : [];
  list.push({
    at: new Date().toISOString(),
    readiness: score.readiness,
    met: score.met,
    partly: score.partly,
    missing: score.missing,
  });
  all[id] = list.slice(-20);
  saveHistory(all);
  renderHistory();
}

function clearHistory() {
  const all = loadHistory();
  delete all[listingPayload().id];
  saveHistory(all);
  renderHistory();
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    return iso;
  }
}

function renderHistory() {
  const list = listingHistory();
  const root = $("history");
  if (!list.length) {
    root.innerHTML = '<p class="muted">No attempts stored for this listing yet. Scores stay in this browser only.</p>';
    return;
  }
  const last = list[list.length - 1];
  const prev = list.length > 1 ? list[list.length - 2] : null;
  let delta = "";
  if (prev && last.readiness != null && prev.readiness != null) {
    const diff = last.readiness - prev.readiness;
    if (diff > 0) delta = "Up " + diff + " point" + (diff === 1 ? "" : "s") + " from the last attempt.";
    else if (diff < 0) delta = "Down " + Math.abs(diff) + " point" + (Math.abs(diff) === 1 ? "" : "s") + " from the last attempt.";
    else delta = "Same readiness score as the last attempt.";
  }
  root.innerHTML =
    (delta ? '<p class="delta">' + escapeHtml(delta) + "</p>" : "") +
    '<ol class="history-list">' +
    list
      .map((item, i) => {
        const label = item.readiness == null ? "No scored criteria" : item.readiness + "% readiness";
        return (
          "<li><span class=\"hist-n\">Attempt " +
          (i + 1) +
          "</span> <span class=\"hist-score\">" +
          escapeHtml(label) +
          "</span> <span class=\"hist-meta\">" +
          escapeHtml(formatTime(item.at)) +
          " · " +
          item.met +
          " met, " +
          item.partly +
          " partly, " +
          item.missing +
          " missing</span></li>"
        );
      })
      .join("") +
    "</ol>";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusLabel(status) {
  if (status === "met") return "Met";
  if (status === "partly") return "Partly";
  if (status === "not_stated") return "Not stated";
  return "Missing";
}

function renderResult(data) {
  const result = $("result");
  result.hidden = false;
  const score = data.score || {};
  const readiness = score.readiness == null ? "n/a" : score.readiness + "%";
  const demoBanner = data.demo
    ? '<div class="banner demo">Demo response. No Groq API key is set on the server, so this is not a real AI review.</div>'
    : "";
  const cards = (data.criteria || [])
    .map((c) => {
      const quotes = (c.evidence_quotes || [])
        .map((q) => "<blockquote>" + escapeHtml(q) + "</blockquote>")
        .join("");
      const suggestion = c.suggestion
        ? '<p class="suggestion"><strong>Try this:</strong> ' + escapeHtml(c.suggestion) + "</p>"
        : "";
      const evidence = quotes || (c.status === "missing" || c.status === "not_stated"
        ? '<p class="muted">No essay quote was offered as evidence.</p>'
        : "");
      return (
        '<article class="criterion status-' +
        escapeHtml(c.status) +
        '"><div class="crit-head"><h3>' +
        escapeHtml(c.name) +
        '</h3><span class="pill pill-' +
        escapeHtml(c.status) +
        '">' +
        statusLabel(c.status) +
        "</span></div><p>" +
        escapeHtml(c.rationale || "") +
        "</p>" +
        evidence +
        suggestion +
        "</article>"
      );
    })
    .join("");

  result.innerHTML =
    demoBanner +
    '<div class="scoreboard">' +
    '<div class="readiness">' +
    escapeHtml(String(readiness)) +
    '<span>Readiness</span></div>' +
    '<ul class="score-breakdown">' +
    "<li><strong>" + (score.met || 0) + "</strong> met</li>" +
    "<li><strong>" + (score.partly || 0) + "</strong> partly</li>" +
    "<li><strong>" + (score.missing || 0) + "</strong> missing</li>" +
    "<li><strong>" + (score.not_stated || 0) + "</strong> not stated</li>" +
    "</ul></div>" +
    '<p class="summary">' +
    escapeHtml(data.overall_summary || "") +
    "</p>" +
    '<div class="criteria-list">' +
    (cards || "<p>No criteria were returned.</p>") +
    "</div>";
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function scoreEssay() {
  const payload = listingPayload();
  const essay = $("essay").value.trim();
  const error = $("form-error");
  error.hidden = true;
  if (!payload.text) {
    error.textContent = "Choose a sample listing or paste listing text.";
    error.hidden = false;
    return;
  }
  if (essay.length < 40) {
    error.textContent = "Paste an essay of at least 40 characters.";
    error.hidden = false;
    return;
  }

  const button = $("score-btn");
  button.disabled = true;
  button.textContent = "Scoring…";
  try {
    const res = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingTitle: payload.title,
        listingText: payload.text,
        essay,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Scoring failed. Please try again.");
    }
    renderResult(data);
    if (data.score) pushHistory(data.score);
  } catch (err) {
    error.textContent = err.message || "Scoring failed. Please try again.";
    error.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = listingHistory().length ? "Re-score this draft" : "Check readiness";
  }
}

function init() {
  listingOptions();
  $("listing-select").addEventListener("change", syncListingUI);
  $("sample-essay-btn").addEventListener("click", () => {
    $("essay").value = SAMPLE_ESSAY;
    $("essay").focus();
  });
  $("clear-history-btn").addEventListener("click", () => {
    if (confirm("Clear score history for this listing on this browser?")) clearHistory();
  });
  $("score-form").addEventListener("submit", (event) => {
    event.preventDefault();
    scoreEssay();
  });
  syncListingUI();
}

document.addEventListener("DOMContentLoaded", init);
