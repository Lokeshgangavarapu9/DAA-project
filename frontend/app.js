// KMP Trainer frontend. Pass rates and comparison costs come from the C backend (data.js).
var B = (typeof BACKEND !== "undefined") ? BACKEND : null;
var MODELS = [
  {name: "DemoGPT-S", note: "untrained agent", level: 0},
  {name: "DemoGPT-M", note: "20 training rounds", level: 1},
  {name: "DemoGPT-L", note: "200 training rounds", level: 2}
];
var model = 1, attempts = [], running = false, timer = null, retryCounts = [0, 0, 0];

function $(id) { return document.getElementById(id); }
function pick(a) { return (a && a.length) ? a[Math.floor(Math.random() * a.length)] : 0; }
function avg(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }
function pct(n, d) { return d ? Math.round(n * 100 / d) : 0; }
function letter() { return String.fromCharCode(65 + Math.floor(Math.random() * 26)); }

if (!B) {
  document.querySelector("main").innerHTML = '<p class="warn">data.js not found. Build and run the C backend first: cd backend, gcc -o kmp_backend main.c, ./kmp_backend</p>';
} else {
  renderProblem(); renderModels(); renderBoxes(); renderBench();
  var tabs = document.querySelectorAll("nav button"), i;
  for (i = 0; i < tabs.length; i++) tabs[i].onclick = function () { show(this.getAttribute("data-tab")); };
  $("run").onclick = startSession;
  $("models").onclick = function (e) {
    var b = e.target.closest("button");
    if (!b || running) return;
    model = +b.getAttribute("data-m"); renderModels();
  };
}

function show(tab) {
  var ids = ["problem", "round", "bench"], j, btns = document.querySelectorAll("nav button");
  for (j = 0; j < 3; j++) { $(ids[j]).hidden = ids[j] !== tab; btns[j].className = ids[j] === tab ? "on" : ""; }
}

function renderProblem() {
  var h = "<h2>" + B.problem.title + "</h2><p class='lead'>" + B.problem.text + "</p>" +
          "<h3>Why it is hard</h3><p>" + B.problem.why + "</p><h3>The three obstacles</h3><ol class='refs'>", j;
  for (j = 0; j < B.obstacles.length; j++) h += "<li><b>" + B.obstacles[j].name + ".</b> " + B.obstacles[j].task + "</li>";
  h += "</ol><h3>References</h3><ol class='refs'>";
  for (j = 0; j < B.refs.length; j++)
    h += "<li>" + B.refs[j].t + " <a href='" + B.refs[j].u + "' target='_blank' rel='noopener'>" + B.refs[j].u + "</a></li>";
  $("problem").innerHTML = h + "</ol>";
}

function renderModels() {
  $("models").innerHTML = MODELS.map(function (m, j) {
    return "<button data-m='" + j + "' class='" + (j === model ? "on" : "") + "'" + (running ? " disabled" : "") +
           "><b>" + m.name + "</b><span>" + m.note + "</span></button>";
  }).join("");
}

function renderBoxes() {
  $("boxes").innerHTML = B.obstacles.map(function (o, j) {
    return "<div class='box' id='ob" + j + "'><div class='bhead'><h3>" + (j + 1) + ". " + o.name + "</h3><span class='chip' id='chip" + j + "'>Waiting</span></div>" +
      "<p class='task'>" + o.task + "</p><div class='strip' id='strip" + j + "'>Waiting for the model.</div>" +
      "<div class='meter'><div class='mfill' id='m" + j + "'></div></div>" +
      "<div class='meta'><span id='cmp" + j + "'>0 / " + o.budget + " comparisons</span><span id='msg" + j + "'></span></div>" +
      "<button class='retry' id='retry" + j + "' hidden>Retry</button></div>";
  }).join("");
  B.obstacles.forEach(function (o, j) { $("retry" + j).onclick = function () { retryCounts[j] = 0; runStage(j); }; });
}

function setBox(j, state, text) { $("ob" + j).className = "box " + state; $("chip" + j).className = "chip " + state; $("chip" + j).textContent = text; }

function threatName() {
  var r = Math.random() * 100, k = 0, sum = B.weights[0];
  while (r >= sum && k < B.weights.length - 1) { k++; sum += B.weights[k]; }
  return B.patterns[k];
}

function makeLine(threat, flood) {
  var s = "", decoy = threat.slice(0, -1), pos = 25 + Math.floor(Math.random() * 55);
  while (s.length < 120) s += (flood || Math.random() < 0.07) ? decoy : letter();
  return {text: s.slice(0, pos) + threat + s.slice(pos + threat.length, 120), pos: pos, len: threat.length};
}

function drawStrip(j, line, idx, hit) {
  var t = line.text, p = line.pos;
  $("strip" + j).innerHTML = hit
    ? "<span class='done'>" + t.slice(0, p) + "</span><span class='hit'>" + t.slice(p, p + line.len) + "</span>" + t.slice(p + line.len)
    : "<span class='done'>" + t.slice(0, idx) + "</span><span class='head'>" + (t.charAt(idx) || "") + "</span>" + t.slice(idx + 1);
}

function startSession() {
  if (running) return;
  retryCounts = [0, 0, 0];
  renderBoxes();
  $("status").textContent = MODELS[model].name + " entering obstacle 1.";
  runStage(0);
}

function runStage(j) {
  var o = B.obstacles[j], lv = MODELS[model].level;
  var p = Math.min(0.95, Math.max(0.05, o.rate[lv] / 100 + (Math.random() - 0.5) * 0.16));
  var pass = Math.random() < p, threat = threatName(), line = makeLine(threat, j === 0);
  var reason = pass ? "" : (Math.random() < 0.5 ? "budget" : "missed");
  var cost = pass ? Math.min(pick(o.kmp), o.budget - 1) : (reason === "budget" ? o.budget : Math.round(o.budget * (0.8 + Math.random() * 0.2)));
  var naive = pass ? ((o.naive && o.naive.length) ? pick(o.naive) : Math.round(cost * (j === 0 ? 2.4 : 1.5))) : cost;
  var end = pass ? line.pos + line.len : (reason === "budget" ? Math.floor(120 * (0.45 + Math.random() * 0.35)) : 120);
  var ticks = 38 + Math.floor(Math.random() * 22), t = 0;
  running = true; $("run").disabled = true; renderModels();
  $("retry" + j).hidden = true; $("msg" + j).textContent = ""; setBox(j, "run", "Running");
  $("status").textContent = MODELS[model].name + " is on obstacle " + (j + 1) + " of 3.";
  timer = setInterval(function () {
    var f, idx, c;
    t++; f = t / ticks; idx = Math.floor(end * f); c = Math.round(cost * f);
    drawStrip(j, line, idx, false);
    $("cmp" + j).textContent = c + " / " + o.budget + " comparisons";
    $("m" + j).style.width = Math.min(100, c * 100 / o.budget) + "%";
    if (t >= ticks) { clearInterval(timer); finish(j, pass, cost, naive, reason, threat, line); }
  }, 60);
}

function finish(j, pass, cost, naive, reason, threat, line) {
  var o = B.obstacles[j], s = (pass ? 10 : -5) - cost / 100;
  attempts.push({model: model, ob: j, pass: pass, cost: cost, naive: naive, score: s});
  renderBench();
  if (pass) {
    retryCounts[j] = 0;
    running = false; $("run").disabled = false; renderModels();
    drawStrip(j, line, 0, true);
    setBox(j, "pass", "Passed");
    $("msg" + j).textContent = "Found " + threat + " at position " + line.pos + " in " + cost + " comparisons.";
    if (j < B.obstacles.length - 1) setTimeout(function () { runStage(j + 1); }, 800);
    else $("status").innerHTML = MODELS[model].name + " cleared all three obstacles. <button class='link' id='go'>View benchmarks</button>";
    if ($("go")) $("go").onclick = function () { show("bench"); };
  } else {
    retryCounts[j]++;
    $("msg" + j).textContent = reason === "budget" ? "Budget ran out after " + o.budget + " comparisons." : threat + " was not armed, so it slipped through.";
    if (retryCounts[j] < 5) {
      setBox(j, "fail retry", "Retrying...");
      $("retry" + j).hidden = true;
      $("status").textContent = "Obstacle " + (j + 1) + " failed - Auto retrying in 1 second... Attempt " + (retryCounts[j] + 1) + " of 5";
      running = true; $("run").disabled = true; renderModels();
      setTimeout(function () { runStage(j); }, 1000);
    } else {
      setBox(j, "fail", "Failed");
      $("retry" + j).hidden = false;
      $("status").textContent = "Obstacle " + (j + 1) + " failed after 5 auto-retries. Press Retry to try again.";
      running = false; $("run").disabled = false; renderModels();
    }
  }
}

function bar(label, value, max, text, color) {
  var w = max <= 0 ? 0 : Math.max(2, Math.round(value / max * 100));
  return "<div class='row'><span>" + label + "</span><div class='track'><div class='fill' style='width:" + w + "%;background:" + color + "'></div></div><span class='num'>" + text + "</span></div>";
}

function renderBench() {
  var el = $("bench"), n = attempts.length, j, a, passes = 0, sc = [], kc = [], nc = [], run = 0, runs = [];
  if (!n) { el.innerHTML = "<h2>Benchmarks</h2><p class='empty'>No attempts yet. Open Obstacle Round, pick a model and press Run.</p>"; return; }
  for (j = 0; j < n; j++) { a = attempts[j]; if (a.pass) passes++; sc.push(a.score); kc.push(a.cost); nc.push(a.naive); run += a.score; runs.push(run / (j + 1)); }
  var h = "<h2>Benchmarks</h2><div class='grid'>" +
    card("Attempts", n, passes + " passed, " + (n - passes) + " failed") +
    card("Pass rate", pct(passes, n) + "%", "all obstacles") +
    card("Average score", avg(sc).toFixed(2), "+10 pass, -5 fail, minus cost") +
    card("Comparisons per attempt", Math.round(avg(kc)), "KMP; naive would need " + Math.round(avg(nc))) + "</div>";

  var rows = "";
  for (j = 0; j < B.obstacles.length; j++) rows += bar(B.obstacles[j].name, pass_of(function (x) { return x.ob === j; }), 100, pass_of(function (x) { return x.ob === j; }) + "%", "var(--teal)");
  h += "<div class='panel'><h3>Pass rate by obstacle</h3>" + rows + "</div>";

  rows = "";
  for (j = 0; j < MODELS.length; j++) if (count(function (x) { return x.model === j; })) rows += bar(MODELS[j].name, pass_of(function (x) { return x.model === j; }), 100, pass_of(function (x) { return x.model === j; }) + "%", "var(--pass)");
  h += "<div class='panel'><h3>Pass rate by model</h3>" + rows + "</div>";

  var mx = Math.max(avg(kc), avg(nc));
  h += "<div class='panel'><h3>Average comparisons per attempt</h3>" + bar("KMP", avg(kc), mx, Math.round(avg(kc)), "var(--teal)") + bar("Naive (estimate)", avg(nc), mx, Math.round(avg(nc)), "#9aa7ae") + "</div>";

  var W = 640, H = 200, P = 30, pts = "", dots = "", x, y;
  for (j = 0; j < n; j++) {
    x = P + (n === 1 ? (W - 2 * P) / 2 : j * (W - 2 * P) / (n - 1));
    pts += x.toFixed(1) + "," + yy(runs[j]).toFixed(1) + " ";
    dots += "<circle cx='" + x.toFixed(1) + "' cy='" + yy(sc[j]).toFixed(1) + "' r='5' class='" + (attempts[j].pass ? "dp" : "df") + "'/>";
  }
  function yy(s) { return H - P - (Math.max(-10, Math.min(10, s)) + 10) / 20 * (H - 2 * P); }
  h += "<div class='panel'><h3>Score per attempt</h3><svg class='chart' viewBox='0 0 " + W + " " + H + "'>" +
    "<line x1='" + P + "' y1='" + yy(0) + "' x2='" + (W - P) + "' y2='" + yy(0) + "' stroke='currentColor' opacity='0.3'/>" +
    "<text x='2' y='" + (yy(10) + 4) + "' font-size='11' fill='currentColor'>+10</text><text x='10' y='" + (yy(0) + 4) + "' font-size='11' fill='currentColor'>0</text><text x='2' y='" + (yy(-10) + 4) + "' font-size='11' fill='currentColor'>-10</text>" +
    "<polyline points='" + pts + "' fill='none' stroke='currentColor' stroke-width='3' stroke-linejoin='round'/>" + dots + "</svg>" +
    "<p class='foot'>Dots are single attempts (green passed, red failed). The line is the running average score.</p></div>" +
    "<button class='reset' id='reset'>Reset benchmarks</button>";
  el.innerHTML = h;
  $("reset").onclick = function () { attempts = []; renderBench(); };
}

function card(l, v, n) { return "<div class='card'><div class='l'>" + l + "</div><div class='v'>" + v + "</div><div class='n'>" + n + "</div></div>"; }
function count(test) { var c = 0, j; for (j = 0; j < attempts.length; j++) if (test(attempts[j])) c++; return c; }
function pass_of(test) { var c = 0, p = 0, j; for (j = 0; j < attempts.length; j++) if (test(attempts[j])) { c++; if (attempts[j].pass) p++; } return pct(p, c); }
