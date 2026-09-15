
import "./style.css";

const app = document.getElementById("app");

const players = [
  { id: 1, name: "KralBaba", emoji: "🔵", score: 0, active: true, drawings: [] },
  { id: 2, name: "Ali", emoji: "🟢", score: 0, active: true, drawings: [] },
  { id: 3, name: "Ece", emoji: "🟡", score: 0, active: true, drawings: [] },
  { id: 4, name: "Mert", emoji: "🟣", score: 0, active: true, drawings: [] }
];

const DRAWINGS_PER_PLAYER = 4;

const tasks = [
  { text: "KEDİ ÇİZ", answer: "kedi", emoji: "🐱", words: ["kedi", "cat", "pisicik"] },
  { text: "KÖPEK ÇİZ", answer: "köpek", emoji: "🐶", words: ["köpek", "kopek", "dog"] },
  { text: "EV ÇİZ", answer: "ev", emoji: "🏠", words: ["ev", "house"] },
  { text: "ARABA ÇİZ", answer: "araba", emoji: "🚗", words: ["araba", "otomobil", "araba"] },
  { text: "AĞAÇ ÇİZ", answer: "ağaç", emoji: "🌳", words: ["ağaç", "agac", "ağaç"] },
  { text: "GÜNEŞ ÇİZ", answer: "güneş", emoji: "☀️", words: ["güneş", "gunes", "sun"] },
  { text: "ELMA ÇİZ", answer: "elma", emoji: "🍎", words: ["elma", "apple"] },
  { text: "BALIK ÇİZ", answer: "balık", emoji: "🐟", words: ["balık", "balik", "fish"] },
  { text: "UÇAK ÇİZ", answer: "uçak", emoji: "✈️", words: ["uçak", "ucak", "uçak", "plane"] },
  { text: "HAMBURGER ÇİZ", answer: "hamburger", emoji: "🍔", words: ["hamburger", "burger"] },
  { text: "TOP ÇİZ", answer: "top", emoji: "⚽", words: ["top", "futbol topu"] },
  { text: "ÇİÇEK ÇİZ", answer: "çiçek", emoji: "🌸", words: ["çiçek", "cicek", "çiçek"] }
];

let timer = null;
let seconds = 60;
let canvas = null;
let ctx = null;
let drawing = false;
let hasDrawn = false;

let drawState = {
  turn: 0,
  drawerId: 1,
  task: null,
  guesses: [],
  finished: false
};

let hideState = null;
let hideTimer = null;
let hideTickTimer = null;

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(text) {
  return text
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .trim();
}

function clearAllTimers() {
  clearInterval(timer);
  clearInterval(hideTimer);
  clearInterval(hideTickTimer);
  timer = null;
  hideTimer = null;
  hideTickTimer = null;
}

function showSplash() {
  app.innerHTML = `
    <main class="splash">
      <div class="logo">🎮</div>
      <h1>OYUN<br>TOPLULUĞU</h1>
      <p>Çiz, saklan, yakala ve kazan.</p>
      <div class="loader"><span></span></div>
    </main>
  `;
  setTimeout(showHome, 1200);
}

function showHome() {
  clearAllTimers();

  app.innerHTML = `
    <main class="home">
      <header>
        <div>
          <small>MERHABA 👋</small>
          <h1>Oyun Topluluğu</h1>
        </div>
        <button class="profile">👤</button>
      </header>

      <section class="hero">
        <div>
          <span>OFFLINE MVP</span>
          <h2>Arkadaşlarınla<br>yarışmaya hazır mısın?</h2>
          <p>Çizim Yarışması ve Saklambaç artık oynanabilir.</p>
        </div>
        <div class="trophy">🏆</div>
      </section>

      <h2 class="title">Oyunlar</h2>

      <button class="game" id="drawingGame">
        <div class="game-icon">🎨</div>
        <div>
          <h3>Çizim Yarışması</h3>
          <p>Bir oyuncu çizer, diğerleri tahmin eder.</p>
          <small>4 OYUNCU · 16 TUR</small>
        </div>
        <strong>›</strong>
      </button>

      <button class="game" id="hideGame">
        <div class="game-icon">🫣</div>
        <div>
          <h3>Saklambaç</h3>
          <p>Eşyaya dönüş, saklan, ıslık çal ve ebeyi şaşırt.</p>
          <small>4 OYUNCU · 3 DK / TUR</small>
        </div>
        <strong>›</strong>
      </button>

      <button class="game disabled">
        <div class="game-icon">⚡</div>
        <div>
          <h3>Refleks</h3>
          <p>En hızlı tepki veren kazanır.</p>
          <small>YAKINDA</small>
        </div>
        <strong>›</strong>
      </button>

      <section class="home-players">
        <h2 class="title">Oyuncular</h2>
        ${players.map(p => `
          <div class="home-player">
            <span>${p.emoji}</span>
            <strong>${p.id}. ${escapeHtml(p.name)}</strong>
            <b>${p.score} puan</b>
          </div>
        `).join("")}
      </section>

      <nav>
        <button>🏠<small>Ana Sayfa</small></button>
        <button>🏆<small>Sıralama</small></button>
        <button>⚙️<small>Ayarlar</small></button>
      </nav>
    </main>
  `;

  document.getElementById("drawingGame").onclick = startDrawingGame;
  document.getElementById("hideGame").onclick = startHideGame;
}

/* -------------------- ÇİZİM YARIŞMASI -------------------- */

function resetScores() {
  players.forEach(p => {
    p.score = 0;
    p.drawings = [];
    p.active = true;
  });
}

function activePlayers() {
  return players.filter(p => p.active);
}

function nextDrawerId(currentId) {
  const active = activePlayers();
  const index = active.findIndex(p => p.id === currentId);
  return active[(index + 1) % active.length]?.id ?? currentId;
}

function taskForTurn(turn) {
  const shuffled = [...tasks].sort(() => Math.random() - 0.5);
  return shuffled[turn % shuffled.length];
}

function startDrawingGame() {
  clearAllTimers();
  resetScores();

  drawState = {
    turn: 0,
    drawerId: 1,
    task: taskForTurn(0),
    guesses: [],
    finished: false
  };

  startDrawingTurn();
}

function startDrawingTurn() {
  clearInterval(timer);
  drawState.finished = false;
  drawState.guesses = [];
  seconds = 60;

  const drawer = players.find(p => p.id === drawState.drawerId);
  const isHumanDrawer = drawer.id === 1;

  app.innerHTML = `
    <main class="drawing-page">
      <header class="game-header">
        <button class="back" id="backHome">‹</button>
        <div class="round-title">
          <small>ÇİZİM YARIŞMASI</small>
          <strong>${drawState.turn + 1}. / 16. TUR</strong>
        </div>
        <div class="timer" id="timer">01:00</div>
      </header>

      <div class="turn-banner">
        ${drawer.emoji} <strong>${escapeHtml(drawer.name)}</strong> çiziyor
        <span>${isHumanDrawer ? "Sıra sende!" : "Bot çizimi hazırlanıyor..."}</span>
      </div>

      <section class="mission ${isHumanDrawer ? "" : "mission-hidden"}">
        <small>SADECE ÇİZEN GÖRÜR</small>
        <h1>${escapeHtml(drawState.task.text)}</h1>
        <span>${drawState.task.emoji}</span>
      </section>

      <section class="draw-card">
        <canvas id="drawCanvas"></canvas>
      </section>

      <div class="draw-tools">
        <button id="clearCanvas">🗑️ Temizle</button>
        <button id="finishDrawing" class="finish">BİTİRDİM ✓</button>
      </div>

      <section class="chat-panel">
        <div class="chat-header">
          <div>
            <strong>💬 Tahminler</strong>
            <small>Doğru cevap gizli tutulur.</small>
          </div>
          <b id="correctCount">0 / 3</b>
        </div>

        <div class="chat-messages" id="chatMessages">
          <div class="system-message">🎨 ${escapeHtml(drawer.name)} çizime başladı. Tahminler burada görünecek.</div>
        </div>

        <form class="guess-input-area" id="guessForm">
          <input id="guessInput" autocomplete="off" placeholder="${isHumanDrawer ? "Botlar tahmin ediyor..." : "Tahminini yaz..."}" ${isHumanDrawer ? "disabled" : ""}>
          <button type="submit" ${isHumanDrawer ? "disabled" : ""}>GÖNDER</button>
        </form>
      </section>

      <section class="players">
        ${players.map(p => `
          <div class="player ${p.id === drawer.id ? "current" : ""}">
            <span>${p.emoji}</span>
            <div>
              <strong>${p.id}. ${escapeHtml(p.name)}</strong>
              <small>${p.id === drawer.id ? "🎨 Çiziyor" : "💬 Tahmin ediyor"} · ${p.score} puan</small>
            </div>
          </div>
        `).join("")}
      </section>
    </main>
  `;

  setupCanvas();

  document.getElementById("backHome").onclick = () => {
    clearAllTimers();
    showHome();
  };
  document.getElementById("clearCanvas").onclick = clearCanvas;
  document.getElementById("finishDrawing").onclick = finishDrawing;

  document.getElementById("guessForm").onsubmit = (event) => {
    event.preventDefault();
    const input = document.getElementById("guessInput");
    submitGuess(1, input.value);
    input.value = "";
  };

  if (!isHumanDrawer) {
    drawBotDrawing(drawState.task);
    setTimeout(() => {
      addSystemMessage(`${drawer.name} çizimini tamamladı. Şimdi tahminler başlıyor.`);
    }, 900);
  }

  startDrawTimer();

  if (isHumanDrawer) {
    runBotGuesses();
  }
}

function startDrawTimer() {
  timer = setInterval(() => {
    seconds--;
    updateTimer();

    if (seconds <= 0) {
      finishDrawing();
    }
  }, 1000);
}

function updateTimer() {
  const el = document.getElementById("timer");
  if (!el) return;
  el.textContent = `00:${String(Math.max(0, seconds)).padStart(2, "0")}`;
  if (seconds <= 10) el.classList.add("danger");
}

function setupCanvas() {
  canvas = document.getElementById("drawCanvas");
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);

  ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#ffffff";

  drawing = false;
  hasDrawn = false;

  canvas.addEventListener("pointerdown", startDrawing);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);
}

function getPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function startDrawing(event) {
  drawing = true;
  hasDrawn = true;
  canvas.setPointerCapture?.(event.pointerId);
  const pos = getPosition(event);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(event) {
  if (!drawing) return;
  const pos = getPosition(event);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function stopDrawing() {
  drawing = false;
}

function clearCanvas() {
  if (!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  hasDrawn = false;
}

function drawBotDrawing(task) {
  if (!canvas || !ctx) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";

  const circle = (x, y, r) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  };

  const line = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  switch (task.answer) {
    case "kedi":
      circle(w * .5, h * .43, 65);
      line(w * .43, h * .22, w * .39, h * .08);
      line(w * .57, h * .22, w * .61, h * .08);
      circle(w * .47, h * .42, 5);
      circle(w * .53, h * .42, 5);
      line(w * .48, h * .5, w * .52, h * .5);
      line(w * .5, h * .51, w * .46, h * .55);
      line(w * .5, h * .51, w * .54, h * .55);
      ctx.beginPath();
      ctx.arc(w * .5, h * .65, 85, 0, Math.PI);
      ctx.stroke();
      break;

    case "köpek":
      ctx.beginPath();
      ctx.roundRect(w * .34, h * .28, w * .32, h * .3, 30);
      ctx.stroke();
      circle(w * .43, h * .4, 5);
      circle(w * .57, h * .4, 5);
      line(w * .5, h * .47, w * .46, h * .53);
      line(w * .5, h * .47, w * .54, h * .53);
      ctx.beginPath();
      ctx.arc(w * .5, h * .63, 70, 0, Math.PI);
      ctx.stroke();
      break;

    case "ev":
      line(w*.25,h*.55,w*.5,h*.22);
      line(w*.5,h*.22,w*.75,h*.55);
      ctx.strokeRect(w*.3,h*.53,w*.4,h*.3);
      ctx.strokeRect(w*.45,h*.65,w*.1,h*.18);
      ctx.strokeRect(w*.34,h*.59,w*.08,h*.08);
      ctx.strokeRect(w*.58,h*.59,w*.08,h*.08);
      break;

    case "araba":
      ctx.beginPath();
      ctx.roundRect(w*.2,h*.5,w*.6,h*.2,25);
      ctx.stroke();
      line(w*.32,h*.5,w*.4,h*.37);
      line(w*.4,h*.37,w*.6,h*.37);
      line(w*.6,h*.37,w*.68,h*.5);
      circle(w*.33,h*.73,25);
      circle(w*.67,h*.73,25);
      break;

    case "ağaç":
      line(w*.5,h*.48,w*.5,h*.78);
      ctx.beginPath();
      ctx.arc(w*.5,h*.35,95,0,Math.PI*2);
      ctx.stroke();
      line(w*.5,h*.58,w*.4,h*.47);
      line(w*.5,h*.61,w*.6,h*.5);
      break;

    case "güneş":
      circle(w*.5,h*.48,65);
      for (let i=0;i<8;i++) {
        const a = i * Math.PI / 4;
        line(w*.5+Math.cos(a)*90,h*.48+Math.sin(a)*90,w*.5+Math.cos(a)*125,h*.48+Math.sin(a)*125);
      }
      break;

    case "elma":
      circle(w*.45,h*.52,60);
      circle(w*.55,h*.52,60);
      line(w*.5,h*.3,w*.53,h*.2);
      ctx.beginPath();
      ctx.arc(w*.57,h*.23,25,0,Math.PI);
      ctx.stroke();
      break;

    case "balık":
      ctx.beginPath();
      ctx.ellipse(w*.5,h*.5,115,65,0,0,Math.PI*2);
      ctx.stroke();
      line(w*.25,h*.5,w*.12,h*.4);
      line(w*.25,h*.5,w*.12,h*.6);
      circle(w*.7,h*.47,5);
      line(w*.45,h*.45,w*.55,h*.55);
      break;

    case "uçak":
      line(w*.5,h*.2,w*.5,h*.78);
      line(w*.5,h*.4,w*.25,h*.58);
      line(w*.5,h*.4,w*.75,h*.58);
      line(w*.5,h*.62,w*.36,h*.75);
      line(w*.5,h*.62,w*.64,h*.75);
      break;

    case "hamburger":
      ctx.beginPath();
      ctx.arc(w*.5,h*.48,120,Math.PI,Math.PI*2);
      ctx.stroke();
      ctx.strokeRect(w*.38,h*.48,w*.24,h*.1);
      line(w*.32,h*.62,w*.68,h*.62);
      line(w*.35,h*.7,w*.65,h*.7);
      ctx.beginPath();
      ctx.arc(w*.5,h*.7,120,0,Math.PI);
      ctx.stroke();
      break;

    case "top":
      circle(w*.5,h*.5,100);
      ctx.beginPath();
      ctx.arc(w*.5,h*.5,100,0.2,2.8);
      ctx.stroke();
      line(w*.45,h*.42,w*.55,h*.58);
      break;

    default:
      circle(w*.5,h*.5,90);
  }

  hasDrawn = true;
}

function addChatMessage(name, text, type = "guess") {
  const box = document.getElementById("chatMessages");
  if (!box) return;

  const div = document.createElement("div");
  div.className = `chat-message ${type}`;
  div.innerHTML = `<strong>${escapeHtml(name)}:</strong> ${escapeHtml(text)}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function addSystemMessage(text) {
  const box = document.getElementById("chatMessages");
  if (!box) return;

  const div = document.createElement("div");
  div.className = "system-message";
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function updateCorrectCount() {
  const el = document.getElementById("correctCount");
  if (el) el.textContent = `${drawState.guesses.length} / 3`;
}

function submitGuess(playerId, rawGuess) {
  const guess = rawGuess.trim();
  if (!guess || drawState.finished) return;

  const drawerId = drawState.drawerId;
  if (playerId === drawerId) return;

  if (drawState.guesses.some(g => g.playerId === playerId)) {
    addSystemMessage(`${players.find(p => p.id === playerId).name} zaten doğru bildi.`);
    return;
  }

  const player = players.find(p => p.id === playerId);
  const correct = normalize(guess) === normalize(drawState.task.answer) ||
    drawState.task.words.some(word => normalize(word) === normalize(guess));

  addChatMessage(player.name, guess);

  if (!correct) return;

  const rank = drawState.guesses.length;
  const points = [10, 5, 3][rank] ?? 0;

  player.score += points;
  drawState.guesses.push({ playerId, points });

  addSystemMessage(`🎯 ${player.name} doğru cevapladı ve ${points} puan aldı.`);
  updateCorrectCount();

  if (drawState.guesses.length >= activePlayers().length - 1) {
    setTimeout(() => finishDrawing(), 500);
  }
}

function runBotGuesses() {
  const guessers = players.filter(p => p.id !== drawState.drawerId);
  const wrongGuesses = {
    kedi: ["köpek", "tavşan"],
    köpek: ["kedi", "at"],
    ev: ["kale", "oda"],
    araba: ["otobüs", "uçak"],
    ağaç: ["çiçek", "orman"],
    güneş: ["ay", "yıldız"],
    elma: ["top", "domates"],
    balık: ["kuş", "köpek"],
    uçak: ["araba", "gemi"],
    hamburger: ["pizza", "sandviç"],
    top: ["elma", "balon"],
    çiçek: ["ağaç", "güneş"]
  };

  guessers.forEach((p, index) => {
    setTimeout(() => {
      if (drawState.finished) return;
      const wrong = wrongGuesses[drawState.task.answer]?.[index % 2] ?? "araba";
      submitGuess(p.id, wrong);
    }, 1800 + index * 1700);

    setTimeout(() => {
      if (drawState.finished) return;
      submitGuess(p.id, drawState.task.answer);
    }, 5200 + index * 1900);
  });
}

function finishDrawing() {
  if (drawState.finished) return;
  drawState.finished = true;
  clearInterval(timer);

  const drawer = players.find(p => p.id === drawState.drawerId);
  const guessedPoints = drawState.guesses.reduce((sum, g) => sum + g.points, 0);

  // 12 puan yalnızca gerçekten çizim yapıldıysa verilir.
  const drawerPoints = hasDrawn ? 12 : 0;
  drawer.score += drawerPoints;

  if (hasDrawn && canvas) {
    drawer.drawings.push({
      task: drawState.task.text,
      answer: drawState.task.answer,
      image: canvas.toDataURL("image/png"),
      score: drawerPoints + guessedPoints,
      guessedCount: drawState.guesses.length
    });
  }

  showRoundResult(drawer, drawerPoints, guessedPoints);
}

function showRoundResult(drawer, drawerPoints, guessedPoints) {
  const image = canvas && hasDrawn ? canvas.toDataURL("image/png") : "";
  const nextId = drawState.turn + 1 < 16 ? nextDrawerId(drawer.id) : null;

  app.innerHTML = `
    <main class="round-result">
      <div class="round-result-icon">${hasDrawn ? "🎨" : "⚠️"}</div>
      <small>${drawState.turn + 1}. TUR TAMAMLANDI</small>
      <h1>${hasDrawn ? `${drawer.emoji} ${escapeHtml(drawer.name)} çizdi` : "Çizim yapılmadı"}</h1>
      <p>${hasDrawn ? `Çizen oyuncu +${drawerPoints} puan aldı.` : "Boş tuvale BİTİRDİM denildiği için çizen oyuncuya puan verilmedi."}</p>

      ${image ? `
        <div class="winner-preview">
          <div class="winner-preview-title">
            <span>${drawer.emoji}</span>
            <div>
              <strong>${escapeHtml(drawer.name)}'in çizimi</strong>
              <small>${escapeHtml(drawState.task.text)}</small>
            </div>
          </div>
          <img src="${image}" alt="Tur çizimi">
        </div>
      ` : ""}

      <div class="round-summary">
        <div><span>Çizen</span><b>+${drawerPoints}</b></div>
        <div><span>Tahminlerden</span><b>+${guessedPoints}</b></div>
        <div><span>Toplam puan</span><b>${drawer.score}</b></div>
      </div>

      <section class="round-scores">
        ${players.map(p => `
          <div class="score">
            <div class="rank">${p.id}</div>
            <span>${p.emoji}</span>
            <div class="score-name">
              <strong>${escapeHtml(p.name)}</strong>
              <small>${p.score} puan</small>
            </div>
            <b>${p.id === drawer.id ? `+${drawerPoints}` : ""}</b>
          </div>
        `).join("")}
      </section>

      <button class="primary-button" id="nextRound">
        ${nextId ? `${players.find(p => p.id === nextId).name} SIRASI →` : "SONUÇLARI GÖR"}
      </button>
      <button class="secondary-button" id="drawHome">ANA SAYFAYA DÖN</button>
    </main>
  `;

  document.getElementById("nextRound").onclick = () => {
    if (!nextId) {
      showDrawingFinal();
      return;
    }
    drawState.turn++;
    drawState.drawerId = nextId;
    drawState.task = taskForTurn(drawState.turn);
    startDrawingTurn();
  };

  document.getElementById("drawHome").onclick = showHome;
}

function showDrawingFinal() {
  const ranking = [...activePlayers()].sort((a, b) => b.score - a.score);
  const winner = ranking[0];
  const bestDrawing = [...winner.drawings].sort((a, b) => {
    if (b.guessedCount !== a.guessedCount) return b.guessedCount - a.guessedCount;
    return b.score - a.score;
  })[0];

  app.innerHTML = `
    <main class="results">
      <div class="result-icon">🏆</div>
      <small>ÇİZİM YARIŞMASI BİTTİ</small>
      <h1>${winner.emoji} ${escapeHtml(winner.name)} ŞAMPİYON!</h1>
      <p>16 çizim turunun sonunda en yüksek puanı aldı.</p>

      ${bestDrawing ? `
        <div class="winner-final-drawing">
          <div class="winner-final-header">
            <div>
              <small>KAZANANIN EN İYİ ÇİZİMİ</small>
              <strong>${escapeHtml(winner.name)}</strong>
            </div>
            <span>${winner.emoji}</span>
          </div>
          <div class="winner-image">
            <img src="${bestDrawing.image}" alt="Kazananın çizimi">
          </div>
          <div class="winning-task">
            <span>GÖREV</span>
            <strong>${escapeHtml(bestDrawing.task)}</strong>
            <b>${bestDrawing.guessedCount} doğru tahmin</b>
          </div>
        </div>
      ` : `
        <div class="empty-winner">
          <div>🖼️</div>
          <strong>Kazanan oyuncunun kayıtlı çizimi yok.</strong>
        </div>
      `}

      <h2 class="final-score-title">🏆 Puan Sıralaması</h2>
      <section class="score-list">
        ${ranking.map((p, index) => `
          <div class="score ${index === 0 ? "champion" : ""}">
            <div class="rank">${index + 1}</div>
            <span>${p.emoji}</span>
            <div class="score-name">
              <strong>${escapeHtml(p.name)}</strong>
              <small>${index === 0 ? "🏆 Şampiyon" : "Tamamladı"}</small>
            </div>
            <b>${p.score}</b>
          </div>
        `).join("")}
      </section>

      <button class="primary-button" id="playDrawingAgain">TEKRAR OYNA</button>
      <button class="secondary-button" id="drawingHome">ANA SAYFAYA DÖN</button>
    </main>
  `;

  document.getElementById("playDrawingAgain").onclick = startDrawingGame;
  document.getElementById("drawingHome").onclick = showHome;
}

/* -------------------- SAKLAMBAÇ -------------------- */

const MAP_W = 2200;
const MAP_H = 1350;

const props = [
  { id:"wardrobe1", type:"Dolap", emoji:"🗄️", x:320, y:235, w:130, h:90 },
  { id:"wardrobe2", type:"Dolap", emoji:"🗄️", x:680, y:245, w:130, h:90 },
  { id:"sofa1", type:"Koltuk", emoji:"🛋️", x:1020, y:250, w:180, h:85 },
  { id:"chair1", type:"Sandalye", emoji:"🪑", x:1290, y:235, w:90, h:90 },
  { id:"cabinet1", type:"Konsol", emoji:"🪑", x:1560, y:240, w:150, h:70 },
  { id:"bed1", type:"Yatak", emoji:"🛏️", x:310, y:760, w:200, h:100 },
  { id:"sofa2", type:"Koltuk", emoji:"🛋️", x:650, y:790, w:190, h:85 },
  { id:"table1", type:"Masa", emoji:"🪑", x:970, y:780, w:150, h:90 },
  { id:"cabinet2", type:"Dolap", emoji:"🗄️", x:1270, y:760, w:130, h:90 },
  { id:"plant1", type:"Saksı", emoji:"🪴", x:1540, y:790, w:80, h:80 },
  { id:"books1", type:"Kitaplık", emoji:"📚", x:1830, y:220, w:150, h:100 },
  { id:"box1", type:"Kutu", emoji:"📦", x:1900, y:720, w:100, h:90 },
  { id:"chair2", type:"Sandalye", emoji:"🪑", x:480, y:1110, w:90, h:90 },
  { id:"tv1", type:"TV", emoji:"📺", x:1000, y:1080, w:150, h:70 },
  { id:"plant2", type:"Saksı", emoji:"🪴", x:1500, y:1090, w:80, h:80 }
];

function startHideGame() {
  clearAllTimers();
  players.forEach(p => {
    p.score = 0;
    p.active = true;
  });

  hideState = {
    round: 0,
    maxRounds: 4,
    hiderPhase: true,
    hiderId: 1,
    hunterId: 2,
    timeLeft: 180,
    whistleCount: 0,
    selectedProp: null,
    attackCooldown: 0,
    caught: [],
    positions: {
      1: { x: 300, y: 500, propId: null },
      2: { x: 1800, y: 500, propId: null },
      3: { x: 1050, y: 600, propId: null },
      4: { x: 1700, y: 1050, propId: null }
    },
    transformed: {
      1: null, 2: null, 3: null, 4: null
    }
  };

  startHideRound();
}

function startHideRound() {
  clearInterval(hideTimer);
  clearInterval(hideTickTimer);

  hideState.hunterId = ((hideState.round) % 4) + 1;
  const hiders = players.filter(p => p.id !== hideState.hunterId);
  hideState.hiderId = hiders[0]?.id ?? 1;
  hideState.timeLeft = 180;
  hideState.whistleCount = 0;
  hideState.caught = [];
  hideState.transformed = { 1:null, 2:null, 3:null, 4:null };
  hideState.selectedProp = null;

  players.forEach(p => {
    hideState.positions[p.id] = {
      x: 250 + ((p.id * 390) % 1700),
      y: 260 + ((p.id * 230) % 800),
      propId: null
    };
  });

  renderHideGame();

  hideTimer = setInterval(() => {
    hideState.timeLeft--;
    if (hideState.timeLeft <= 0) {
      endHideRound("Süre doldu!");
      return;
    }
    updateHideHud();
  }, 1000);

  hideTickTimer = setInterval(() => {
    hideState.whistleCount++;
    const hiders = players.filter(p => p.id !== hideState.hunterId && !hideState.caught.includes(p.id));
    hiders.forEach(h => {
      showWhistle(h.id, false);
    });
  }, 10000);

  // Bot davranışı: ebe insan değilse hedeflere yaklaşır.
  if (hideState.hunterId !== 1) {
    runBotHunter();
  }

  // İnsan ebe ise bot saklananlar otomatik eşyalara dönüşür.
  if (hideState.hunterId === 1) {
    autoHideBots();
  }
}

function renderHideGame() {
  const hunter = players.find(p => p.id === hideState.hunterId);
  const isHumanHunter = hunter.id === 1;
  const me = players[0];

  app.innerHTML = `
    <main class="hide-page">
      <header class="hide-header">
        <button class="back" id="hideBack">‹</button>
        <div>
          <small>🫣 SAKLAMBAÇ</small>
          <strong>Tur ${hideState.round + 1} / 4</strong>
        </div>
        <div class="hide-time" id="hideTime">03:00</div>
      </header>

      <section class="hide-topbar">
        <div class="hunter-card">
          <span>👹</span>
          <div>
            <small>EBE</small>
            <strong>${hunter.emoji} ${escapeHtml(hunter.name)}</strong>
          </div>
        </div>
        <div class="hide-tip" id="hideTip">
          ${isHumanHunter ? "Eşyaları kontrol et. Saklananları bul!" : "Saklananlar eşyaya dönüşüyor..."}
        </div>
      </section>

      <div class="hide-game-shell">
        <div class="mini-map">
          <div class="mini-map-title">HARİTA</div>
          <div class="mini-map-grid">
            ${players.map(p => `<i id="mini-${p.id}" class="mini-dot p${p.id}"></i>`).join("")}
          </div>
        </div>

        <div class="hide-viewport" id="hideViewport">
          <div class="hide-map" id="hideMap">
            <div class="map-title">BÜYÜK EV</div>

            <div class="room room1"><span>SALON</span></div>
            <div class="room room2"><span>KÜTÜPHANE</span></div>
            <div class="room room3"><span>YATAK ODASI</span></div>
            <div class="room room4"><span>MUTFAK</span></div>
            <div class="room room5"><span>OTURMA ODASI</span></div>
            <div class="room room6"><span>DEPO</span></div>
            <div class="room room7"><span>HOL</span></div>
            <div class="room room8"><span>BAHÇE</span></div>

            <div class="corridor c1"></div>
            <div class="corridor c2"></div>
            <div class="corridor c3"></div>

            ${props.map(prop => `
              <button
                class="prop"
                id="prop-${prop.id}"
                data-prop="${prop.id}"
                style="left:${prop.x}px;top:${prop.y}px;width:${prop.w}px;height:${prop.h}px"
              >
                <span>${prop.emoji}</span>
                <small>${prop.type}</small>
              </button>
            `).join("")}

            ${players.map(p => `
              <div
                class="hide-player p${p.id}"
                id="hide-player-${p.id}"
                style="left:${hideState.positions[p.id].x}px;top:${hideState.positions[p.id].y}px"
              >
                <span>${p.emoji}</span>
                <b>${p.id}</b>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="hide-controls">
          <div class="joystick">
            <button data-dir="up">▲</button>
            <button data-dir="left">◀</button>
            <button data-dir="right">▶</button>
            <button data-dir="down">▼</button>
          </div>

          <div class="action-buttons">
            <button id="whistleBtn" class="action whistle">📣<small>ISLIK ÇAL</small></button>
            <button id="attackBtn" class="action attack">👊<small>SALDIR</small></button>
            <button id="transformBtn" class="action transform">🪄<small>DÖNÜŞ</small></button>
            <button id="normalBtn" class="action normal">🏃<small>NORMAL HALE DÖN</small></button>
            <button id="catchBtn" class="action catch">🎯<small>YAKALA</small></button>
          </div>
        </div>
      </div>

      <section class="hide-players">
        ${players.map(p => `
          <div class="hide-player-card ${p.id === hunter.id ? "hunter" : ""}" id="hide-card-${p.id}">
            <span>${p.emoji}</span>
            <div>
              <strong>${p.id}. ${escapeHtml(p.name)}</strong>
              <small id="status-${p.id}">${p.id === hunter.id ? "👹 EBE" : "🫣 SAKLANIYOR"}</small>
            </div>
            <b>${p.score}</b>
          </div>
        `).join("")}
      </section>
    </main>
  `;

  document.getElementById("hideBack").onclick = () => {
    clearAllTimers();
    showHome();
  };

  document.querySelectorAll(".prop").forEach(button => {
    button.onclick = () => {
      hideState.selectedProp = button.dataset.prop;
      updateHideTip(`🪄 ${button.querySelector("small").textContent} seçildi.`);
    };
  });

  document.querySelectorAll("[data-dir]").forEach(btn => {
    btn.onclick = () => moveHuman(btn.dataset.dir);
  });

  document.getElementById("whistleBtn").onclick = () => showWhistle(1, true);
  document.getElementById("attackBtn").onclick = humanAttack;
  document.getElementById("transformBtn").onclick = transformHuman;
  document.getElementById("normalBtn").onclick = normalHuman;
  document.getElementById("catchBtn").onclick = humanCatch;

  updateHideHud();
  updateHideControls();
}

function updateHideHud() {
  const el = document.getElementById("hideTime");
  if (!el) return;
  const m = Math.floor(hideState.timeLeft / 60);
  const s = hideState.timeLeft % 60;
  el.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  if (hideState.timeLeft <= 20) el.classList.add("danger");

  players.forEach(p => {
    const dot = document.getElementById(`mini-${p.id}`);
    if (dot) {
      const pos = hideState.positions[p.id];
      dot.style.left = `${(pos.x / MAP_W) * 100}%`;
      dot.style.top = `${(pos.y / MAP_H) * 100}%`;
    }
  });
}

function updateHideTip(text) {
  const el = document.getElementById("hideTip");
  if (el) el.textContent = text;
}

function showWhistle(playerId, manual) {
  const p = players.find(x => x.id === playerId);
  const pos = hideState.positions[playerId];
  const map = document.getElementById("hideMap");
  if (!map) return;

  const marker = document.createElement("div");
  marker.className = "whistle-ping";
  marker.style.left = `${pos.x}px`;
  marker.style.top = `${pos.y}px`;
  marker.textContent = "♪";
  map.appendChild(marker);
  setTimeout(() => marker.remove(), 1300);

  if (hideState.hunterId === 1) {
    updateHideTip(manual ? `📣 ${p.name} ıslık çaldı! Konumuna dikkat et.` : `📣 Islık sesi! ${p.name} tarafında!`);
  }
}

function getHumanPosition() {
  return hideState.positions[1];
}

function moveHuman(dir) {
  if (!hideState || hideState.caught.includes(1)) return;

  const pos = getHumanPosition();
  const speed = 65;
  if (dir === "up") pos.y -= speed;
  if (dir === "down") pos.y += speed;
  if (dir === "left") pos.x -= speed;
  if (dir === "right") pos.x += speed;

  pos.x = clamp(pos.x, 80, MAP_W - 80);
  pos.y = clamp(pos.y, 100, MAP_H - 80);

  updatePlayerVisual(1);
  updateHideControls();
}

function updatePlayerVisual(id) {
  const el = document.getElementById(`hide-player-${id}`);
  if (!el) return;

  const pos = hideState.positions[id];
  el.style.left = `${pos.x}px`;
  el.style.top = `${pos.y}px`;

  const transform = hideState.transformed[id];
  if (transform) {
    el.classList.add("hidden-as-prop");
    el.innerHTML = `<span>${transform.emoji}</span><b>${transform.type}</b>`;
  } else {
    el.classList.remove("hidden-as-prop");
    const p = players.find(x => x.id === id);
    el.innerHTML = `<span>${p.emoji}</span><b>${id}</b>`;
  }

  updateHideHud();
}

function nearestProp(playerId) {
  const pos = hideState.positions[playerId];
  let best = null;
  let dist = Infinity;

  props.forEach(prop => {
    const cx = prop.x + prop.w / 2;
    const cy = prop.y + prop.h / 2;
    const d = Math.hypot(pos.x - cx, pos.y - cy);
    if (d < dist) {
      dist = d;
      best = prop;
    }
  });

  return dist <= 130 ? best : null;
}

function transformHuman() {
  if (hideState.hunterId === 1) {
    updateHideTip("👹 Ebe eşya kılığına giremez.");
    return;
  }

  if (hideState.caught.includes(1)) return;

  const prop = nearestProp(1);
  if (!prop) {
    updateHideTip("Bir eşyanın yanına yaklaşmalısın.");
    return;
  }

  hideState.transformed[1] = prop;
  hideState.positions[1].propId = prop.id;
  updatePlayerVisual(1);
  updateHideTip(`🪄 ${prop.type} oldun! İstersen NORMAL HALE DÖN diyebilirsin.`);
  updateHideControls();
}

function normalHuman() {
  if (!hideState.transformed[1]) {
    updateHideTip("Zaten normalsin.");
    return;
  }

  hideState.transformed[1] = null;
  hideState.positions[1].propId = null;
  updatePlayerVisual(1);
  updateHideTip("🏃 Normal karakterine döndün.");
  updateHideControls();
}

function updateHideControls() {
  const transformed = !!hideState?.transformed?.[1];
  const humanIsHunter = hideState?.hunterId === 1;

  const transform = document.getElementById("transformBtn");
  const normal = document.getElementById("normalBtn");
  const attack = document.getElementById("attackBtn");
  const whistle = document.getElementById("whistleBtn");
  const catcher = document.getElementById("catchBtn");

  if (!transform) return;

  transform.disabled = humanIsHunter || transformed || hideState.caught.includes(1);
  normal.disabled = humanIsHunter || !transformed || hideState.caught.includes(1);
  attack.disabled = humanIsHunter || hideState.caught.includes(1);
  whistle.disabled = hideState.caught.includes(1);
  catcher.disabled = !humanIsHunter;
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function humanAttack() {
  if (hideState.hunterId === 1) {
    updateHideTip("Ebe saldırı yapamaz.");
    return;
  }

  const hunterPos = hideState.positions[hideState.hunterId];
  const humanPos = hideState.positions[1];

  if (distanceBetween(humanPos, hunterPos) > 170) {
    updateHideTip("👊 Ebe çok uzakta. Yaklaşınca SALDIR.");
    return;
  }

  if (hideState.attackCooldown > 0) {
    updateHideTip(`Saldırı beklemede: ${hideState.attackCooldown}s`);
    return;
  }

  hideState.attackCooldown = 10;
  const attackInterval = setInterval(() => {
    hideState.attackCooldown--;
    if (hideState.attackCooldown <= 0) clearInterval(attackInterval);
  }, 1000);

  hideState.transformed[1] = null;
  hideState.positions[1].propId = null;
  updatePlayerVisual(1);

  updateHideTip("💥 SALDIRI BAŞARILI! Ebe 5 saniye dondu!");
  players[0].score += 5;

  const hunter = document.getElementById(`hide-player-${hideState.hunterId}`);
  hunter?.classList.add("frozen");

  setTimeout(() => hunter?.classList.remove("frozen"), 5000);
  updateHideControls();
}

function humanCatch() {
  if (hideState.hunterId !== 1) {
    updateHideTip("Sen bu turda ebe değilsin.");
    return;
  }

  let closest = null;
  let closestDist = Infinity;
  const me = hideState.positions[1];

  players.filter(p => p.id !== 1 && !hideState.caught.includes(p.id)).forEach(p => {
    const d = distanceBetween(me, hideState.positions[p.id]);
    if (d < closestDist) {
      closestDist = d;
      closest = p;
    }
  });

  if (!closest || closestDist > 180) {
    updateHideTip("🎯 Yakında saklanan oyuncu yok.");
    return;
  }

  const targetProp = hideState.transformed[closest.id];
  hideState.caught.push(closest.id);
  players[0].score += 10;

  const el = document.getElementById(`hide-player-${closest.id}`);
  el?.classList.add("caught");

  const status = document.getElementById(`status-${closest.id}`);
  if (status) status.textContent = "💥 YAKALANDI";

  updateHideTip(`🎯 ${closest.name} yakalandı! +10 puan`);

  if (targetProp) {
    targetProp.caught = true;
  }

  const remaining = players.filter(p => p.id !== hideState.hunterId && !hideState.caught.includes(p.id));
  if (!remaining.length) {
    endHideRound("Herkes yakalandı!");
  }
}

function autoHideBots() {
  players.filter(p => p.id !== hideState.hunterId).forEach((p, index) => {
    const available = props[(hideState.round * 3 + index * 4) % props.length];
    hideState.positions[p.id].x = available.x + available.w / 2;
    hideState.positions[p.id].y = available.y + available.h / 2;
    hideState.positions[p.id].propId = available.id;
    hideState.transformed[p.id] = available;
    updatePlayerVisual(p.id);
    const status = document.getElementById(`status-${p.id}`);
    if (status) status.textContent = `🪄 ${available.type} oldu`;
  });
}

function runBotHunter() {
  const botHunterId = hideState.hunterId;
  const hunter = hideState.positions[botHunterId];

  const chase = setInterval(() => {
    if (!hideState || hideState.timeLeft <= 0 || hideState.caught.length >= 3) {
      clearInterval(chase);
      return;
    }

    const targets = players.filter(p => p.id !== botHunterId && !hideState.caught.includes(p.id));
    if (!targets.length) return;

    // Bot ebe en yakın hedefe doğru hareket eder.
    let target = targets[0];
    let min = Infinity;
    targets.forEach(p => {
      const d = distanceBetween(hunter, hideState.positions[p.id]);
      if (d < min) {
        min = d;
        target = p;
      }
    });

    const targetPos = hideState.positions[target.id];
    const dx = targetPos.x - hunter.x;
    const dy = targetPos.y - hunter.y;
    const len = Math.hypot(dx, dy) || 1;

    hunter.x += (dx / len) * 55;
    hunter.y += (dy / len) * 55;
    updatePlayerVisual(botHunterId);

    if (min < 145) {
      hideState.caught.push(target.id);
      players[botHunterId - 1].score += 10;
      const targetEl = document.getElementById(`hide-player-${target.id}`);
      targetEl?.classList.add("caught");
      const status = document.getElementById(`status-${target.id}`);
      if (status) status.textContent = "💥 YAKALANDI";
      updateHideTip(`🎯 ${target.name} yakalandı!`);
    }
  }, 1200);
}

function endHideRound(reason) {
  if (!hideState) return;
  clearInterval(hideTimer);
  clearInterval(hideTickTimer);

  // Hayatta kalan saklananlara bonus.
  players
    .filter(p => p.id !== hideState.hunterId && !hideState.caught.includes(p.id))
    .forEach(p => p.score += 10);

  const hunter = players.find(p => p.id === hideState.hunterId);

  app.innerHTML = `
    <main class="round-result">
      <div class="round-result-icon">🫣</div>
      <small>SAKLAMBAÇ TURU BİTTİ</small>
      <h1>${escapeHtml(reason)}</h1>
      <p>${hunter.emoji} ${escapeHtml(hunter.name)} bu turun ebesiydi.</p>

      <section class="round-scores">
        ${players.map(p => `
          <div class="score">
            <div class="rank">${p.id}</div>
            <span>${p.emoji}</span>
            <div class="score-name">
              <strong>${escapeHtml(p.name)}</strong>
              <small>${p.id === hunter.id ? "👹 Ebe" : "🫣 Saklanan"} · ${p.score} puan</small>
            </div>
            <b>${p.score}</b>
          </div>
        `).join("")}
      </section>

      <button class="primary-button" id="nextHideRound">
        ${hideState.round < 3 ? `${players[(hideState.round + 1) % 4].name} EBE OLSUN →` : "PUAN SIRALAMASI"}
      </button>
      <button class="secondary-button" id="hideHome">ANA SAYFAYA DÖN</button>
    </main>
  `;

  document.getElementById("nextHideRound").onclick = () => {
    if (hideState.round >= 3) {
      showHideFinal();
      return;
    }
    hideState.round++;
    startHideRound();
  };

  document.getElementById("hideHome").onclick = showHome;
}

function showHideFinal() {
  const ranking = [...players].sort((a, b) => b.score - a.score);
  const winner = ranking[0];

  app.innerHTML = `
    <main class="results">
      <div class="result-icon">🏆</div>
      <small>SAKLAMBAÇ BİTTİ</small>
      <h1>${winner.emoji} ${escapeHtml(winner.name)} ŞAMPİYON!</h1>
      <p>Herkes bir kez ebe oldu. En yüksek toplam puan kazandı.</p>

      <div class="hide-champion">
        <div>🫣</div>
        <strong>${escapeHtml(winner.name)}</strong>
        <span>${winner.score} PUAN</span>
      </div>

      <h2 class="final-score-title">🏆 Puan Sıralaması</h2>
      <section class="score-list">
        ${ranking.map((p, index) => `
          <div class="score ${index === 0 ? "champion" : ""}">
            <div class="rank">${index + 1}</div>
            <span>${p.emoji}</span>
            <div class="score-name">
              <strong>${escapeHtml(p.name)}</strong>
              <small>${index === 0 ? "🏆 Şampiyon" : "Tamamladı"}</small>
            </div>
            <b>${p.score}</b>
          </div>
        `).join("")}
      </section>

      <button class="primary-button" id="hideAgain">TEKRAR OYNA</button>
      <button class="secondary-button" id="hideFinalHome">ANA SAYFAYA DÖN</button>
    </main>
  `;

  document.getElementById("hideAgain").onclick = startHideGame;
  document.getElementById("hideFinalHome").onclick = showHome;
}

window.addEventListener("keydown", event => {
  if (!hideState) return;

  const keyMap = {
    ArrowUp: "up", w: "up", W: "up",
    ArrowDown: "down", s: "down", S: "down",
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right"
  };

  const dir = keyMap[event.key];
  if (dir) {
    event.preventDefault();
    moveHuman(dir);
  }
});

showSplash();
  
