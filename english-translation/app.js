const DATA_URL = "../exam-docs/en_sample_test.json";
const STORAGE_KEY = "english-translation-l13-21-v1";
const LESSON_MIN = 13;
const LESSON_MAX = 21;
const ROUND_SIZE = 8;

const ADVERBS = new Set([
  "already","always","usually","often","sometimes","never","ever","just","still",
  "really","very","quite","rather","too","also","only","even","perhaps","maybe",
  "probably","certainly","definitely","quickly","slowly","carefully","suddenly",
  "finally","recently","lately","soon","now","then","today","yesterday","tomorrow",
  "here","there","again","almost","nearly","just"
]);

const CONTRACTIONS = {
  "i'm":"i am","i've":"i have","i'll":"i will","i'd":"i would",
  "you're":"you are","you've":"you have","you'll":"you will","you'd":"you would",
  "he's":"he is","he's":"he has","he'll":"he will","he'd":"he would",
  "she's":"she is","she'll":"she will","she'd":"she would",
  "it's":"it is","it'll":"it will","we're":"we are","we've":"we have",
  "we'll":"we will","we'd":"we would","they're":"they are","they've":"they have",
  "they'll":"they will","they'd":"they would","can't":"cannot","couldn't":"could not",
  "won't":"will not","wouldn't":"would not","shouldn't":"should not",
  "mustn't":"must not","don't":"do not","doesn't":"does not","didn't":"did not",
  "isn't":"is not","aren't":"are not","wasn't":"was not","weren't":"were not",
  "haven't":"have not","hasn't":"has not","hadn't":"had not"
};

let allQuestions = [];
let remainingIds = [];
let roundQuestions = [];

const form = document.getElementById("quiz-form");
const template = document.getElementById("question-template");
const progress = document.getElementById("progress");
const roundLabel = document.getElementById("round-label");
const status = document.getElementById("status");
const finish = document.getElementById("finish");

function lessonNumber(title) {
  const match = title.match(/Lesson\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function splitAlternatives(text) {
  // Slash-separated alternatives in the source are accepted as separate correct forms.
  return text.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean);
}

function expandBracketAlternatives(text) {
  const match = text.match(/\[([^\]]+)\]/);
  if (!match) return [text];
  return match[1].split(/\s*\/\s*/).flatMap(option => {
    const replaced = text.replace(match[0], option.trim());
    return expandBracketAlternatives(replaced);
  });
}

function expandContractionVariants(text) {
  const patterns = [
    ["\\bI'm\\b", ["I am"]],
    ["\\bI've\\b", ["I have"]],
    ["\\bI'll\\b", ["I will"]],
    ["\\bI'd\\b", ["I would"]],
    ["\\byou're\\b", ["you are"]],
    ["\\byou've\\b", ["you have"]],
    ["\\byou'll\\b", ["you will"]],
    ["\\byou'd\\b", ["you would"]],
    ["\\bhe's\\b", ["he is", "he has"]],
    ["\\bhe'll\\b", ["he will"]],
    ["\\bhe'd\\b", ["he would"]],
    ["\\bshe's\\b", ["she is", "she has"]],
    ["\\bshe'll\\b", ["she will"]],
    ["\\bshe'd\\b", ["she would"]],
    ["\\bit's\\b", ["it is", "it has"]],
    ["\\bit'll\\b", ["it will"]],
    ["\\bwe're\\b", ["we are"]],
    ["\\bwe've\\b", ["we have"]],
    ["\\bwe'll\\b", ["we will"]],
    ["\\bwe'd\\b", ["we would"]],
    ["\\bthey're\\b", ["they are"]],
    ["\\bthey've\\b", ["they have"]],
    ["\\bthey'll\\b", ["they will"]],
    ["\\bthey'd\\b", ["they would"]],
    ["\\bcan't\\b", ["cannot", "can not"]],
    ["\\bcouldn't\\b", ["could not"]],
    ["\\bwon't\\b", ["will not"]],
    ["\\bwouldn't\\b", ["would not"]],
    ["\\bshouldn't\\b", ["should not"]],
    ["\\bmustn't\\b", ["must not"]],
    ["\\bdon't\\b", ["do not"]],
    ["\\bdoesn't\\b", ["does not"]],
    ["\\bdidn't\\b", ["did not"]],
    ["\\bisn't\\b", ["is not"]],
    ["\\baren't\\b", ["are not"]],
    ["\\bwasn't\\b", ["was not"]],
    ["\\bweren't\\b", ["were not"]],
    ["\\bhaven't\\b", ["have not"]],
    ["\\bhasn't\\b", ["has not"]],
    ["\\bhadn't\\b", ["had not"]]
  ];
  const results = [text];
  let changed = true;
  while (changed) {
    changed = false;
    for (const [pattern, replacements] of patterns) {
      const current = [...results];
      for (const value of current) {
        const regex = new RegExp(pattern, "i");
        if (!regex.test(value)) continue;
        for (const replacement of replacements) {
          const next = value.replace(regex, replacement);
          if (!results.includes(next)) {
            results.push(next);
            changed = true;
          }
        }
      }
    }
  }
  return results;
}

function buildVariants(source) {
  return splitAlternatives(source)
    .flatMap(expandBracketAlternatives)
    .flatMap(expandContractionVariants);
}

function normalizeToken(token) {
  let t = token.toLowerCase()
    .replace(/[“”"‘’]/g, "")
    .replace(/[.,!?;:()]/g, "");
  if (!t) return "";
  return CONTRACTIONS[t] || t;
}

function tokenize(text) {
  return text
    .replace(/[—–-]/g, " ")
    .split(/\s+/)
    .flatMap(raw => {
      const normalized = normalizeToken(raw);
      return normalized ? normalized.split(/\s+/) : [];
    });
}

function compareWithAdverbFreedom(expected, actual) {
  const expectedTokens = tokenize(expected);
  const actualTokens = tokenize(actual);
  if (!actualTokens.length) return { ok: false, expectedTokens, actualTokens };

  const removeAdverbs = tokens => tokens.filter(t => !ADVERBS.has(t));
  const expectedCore = removeAdverbs(expectedTokens);
  const actualCore = removeAdverbs(actualTokens);

  const sameCore = expectedCore.length === actualCore.length &&
    expectedCore.every((token, i) => token === actualCore[i]);

  const expectedAdverbs = expectedTokens.filter(t => ADVERBS.has(t)).sort();
  const actualAdverbs = actualTokens.filter(t => ADVERBS.has(t)).sort();
  const sameAdverbs = expectedAdverbs.length === actualAdverbs.length &&
    expectedAdverbs.every((token, i) => token === actualAdverbs[i]);

  return {
    ok: sameCore && sameAdverbs,
    expectedTokens,
    actualTokens
  };
}

function grade(answer, source) {
  const variants = buildVariants(source);
  const comparisons = variants.map(v => ({ variant: v, ...compareWithAdverbFreedom(v, answer) }));
  const correct = comparisons.find(c => c.ok);
  if (correct) return { ok: true, variant: correct.variant };

  // Pick the closest variant for the most useful error display.
  comparisons.sort((a, b) => tokenDistance(a.expectedTokens, tokenize(answer)) - tokenDistance(b.expectedTokens, tokenize(answer)));
  return { ok: false, variant: comparisons[0].variant, comparison: comparisons[0] };
}

function tokenDistance(a, b) {
  const dp = Array.from({length: a.length + 1}, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + 1);
    }
  }
  return dp[a.length][b.length];
}

function diffTokens(expectedTokens, actualTokens) {
  const rows = [];
  const dp = Array.from({length: expectedTokens.length + 1}, () => Array(actualTokens.length + 1).fill(0));
  for (let i = 0; i <= expectedTokens.length; i++) dp[i][0] = i;
  for (let j = 0; j <= actualTokens.length; j++) dp[0][j] = j;
  for (let i = 1; i <= expectedTokens.length; i++) {
    for (let j = 1; j <= actualTokens.length; j++) {
      dp[i][j] = expectedTokens[i-1] === actualTokens[j-1]
        ? dp[i-1][j-1]
        : Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + 1);
    }
  }
  let i = expectedTokens.length, j = actualTokens.length;
  while (i || j) {
    if (i && j && expectedTokens[i-1] === actualTokens[j-1]) {
      rows.unshift({type:"same", expected:expectedTokens[i-1], actual:actualTokens[j-1]});
      i--; j--;
    } else if (i && j && dp[i][j] === dp[i-1][j-1] + 1) {
      rows.unshift({type:"replace", expected:expectedTokens[i-1], actual:actualTokens[j-1]});
      i--; j--;
    } else if (i && dp[i][j] === dp[i-1][j] + 1) {
      rows.unshift({type:"missing", expected:expectedTokens[i-1]});
      i--;
    } else {
      rows.unshift({type:"extra", actual:actualTokens[j-1]});
      j--;
    }
  }
  return rows;
}

function renderDiff(container, expected, actual) {
  const rows = diffTokens(tokenize(expected), tokenize(actual));
  const title = document.createElement("div");
  title.textContent = "間違いの場所:";
  container.appendChild(title);
  const diff = document.createElement("div");
  diff.className = "diff";

  rows.forEach(row => {
    if (row.type === "same") return;
    const span = document.createElement("span");
    if (row.type === "replace") {
      span.className = "diff-token actual";
      span.textContent = row.actual;
      span.title = "正しくは: " + row.expected;
    } else if (row.type === "missing") {
      span.className = "diff-token missing";
      span.textContent = "不足: " + row.expected;
    } else {
      span.className = "diff-token actual";
      span.textContent = "余分: " + row.actual;
    }
    diff.appendChild(span);
    if (row.type === "replace") {
      const expectedSpan = document.createElement("span");
      expectedSpan.className = "diff-token expected";
      expectedSpan.textContent = "→ " + row.expected;
      diff.appendChild(expectedSpan);
    }
  });
  container.appendChild(diff);
}

function loadProgress(totalIds) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved)) {
      const valid = new Set(totalIds);
      return saved.filter(id => valid.has(id));
    }
  } catch (_) {}
  return [...totalIds];
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingIds));
}

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function startRound() {
  if (!remainingIds.length) {
    form.classList.add("hidden");
    finish.classList.remove("hidden");
    progress.textContent = "0問残り";
    roundLabel.textContent = "";
    return;
  }
  finish.classList.add("hidden");
  form.classList.remove("hidden");
  roundQuestions = shuffle(remainingIds).slice(0, ROUND_SIZE).map(id => allQuestions.find(q => q.id === id));
  renderRound();
}

function renderRound() {
  form.innerHTML = "";
  roundQuestions.forEach((q, index) => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.id = q.id;
    card.querySelector(".question-number").textContent = `問題 ${index + 1}`;
    card.querySelector(".lesson").textContent = q.lessonTitle;
    card.querySelector(".japanese").textContent = q.japanese;
    card.querySelector(".answer").dataset.id = q.id;
    form.appendChild(card);
  });

  const roundNumber = Math.ceil((allQuestions.length - remainingIds.length + 1) / ROUND_SIZE);
  roundLabel.textContent = `今回 ${roundQuestions.length}問`;
  progress.textContent = `${remainingIds.length}問残り`;
  const first = form.querySelector("textarea");
  if (first) first.focus();
}

function submitRound() {
  const cards = [...form.querySelectorAll(".question-card")];
  let correctCount = 0;
  let wrongCount = 0;

  cards.forEach(card => {
    const id = card.dataset.id;
    const q = roundQuestions.find(item => item.id === id);
    const input = card.querySelector(".answer");
    const feedback = card.querySelector(".feedback");
    const result = grade(input.value.trim(), q.english);

    card.classList.remove("correct", "wrong");
    feedback.className = "feedback";
    feedback.textContent = "";

    if (result.ok) {
      correctCount++;
      card.classList.add("correct");
      feedback.classList.add("correct");
      feedback.textContent = "正解！ 次のラウンドからこの例文は出題されません。";
      remainingIds = remainingIds.filter(remainingId => remainingId !== id);
    } else {
      wrongCount++;
      card.classList.add("wrong");
      feedback.classList.add("wrong");
      feedback.textContent = "不正解です。";
      renderDiff(feedback, result.variant, input.value.trim());
    }
    input.readOnly = true;
  });

  saveProgress();
  progress.textContent = `${remainingIds.length}問残り`;
  status.className = wrongCount
    ? "status error"
    : "status";
  status.textContent = `${correctCount}問正解、${wrongCount}問不正解。`;

  const oldActions = form.querySelector(".actions");
  if (oldActions) oldActions.remove();

  if (remainingIds.length) {
    const actions = document.createElement("div");
    actions.className = "actions";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary-button";
    button.textContent = "次の8問へ";
    button.addEventListener("click", startRound);
    actions.appendChild(button);
    form.appendChild(actions);
  } else {
    finish.classList.remove("hidden");
    form.classList.add("hidden");
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  submitRound();
});

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    if (!form.classList.contains("hidden") && !form.querySelector(".actions")) {
      submitRound();
    }
  }
});

document.getElementById("reset-button").addEventListener("click", () => {
  if (!confirm("正解済みの進捗をすべてリセットしますか？")) return;
  remainingIds = allQuestions.map(q => q.id);
  saveProgress();
  status.className = "status";
  status.textContent = "進捗をリセットしました。";
  startRound();
});

document.getElementById("finish-reset").addEventListener("click", () => {
  remainingIds = allQuestions.map(q => q.id);
  saveProgress();
  startRound();
});

async function init() {
  try {
    const response = await fetch(DATA_URL, {cache: "no-store"});
    if (!response.ok) throw new Error("データの取得に失敗しました");
    const data = await response.json();
    const lessons = Object.values(data.englishSentencesData || {});
    allQuestions = lessons
      .map(lesson => ({lesson, number: lessonNumber(lesson.title)}))
      .filter(({number}) => number >= LESSON_MIN && number <= LESSON_MAX)
      .flatMap(({lesson}) => (lesson.sentences || []).map((pair, index) => ({
        id: `lesson-${lessonNumber(lesson.title)}-${index}`,
        lessonTitle: lesson.title,
        english: pair[0],
        japanese: pair[1]
      })));

    const ids = allQuestions.map(q => q.id);
    remainingIds = loadProgress(ids);
    progress.textContent = `${remainingIds.length}問残り`;
    startRound();
  } catch (error) {
    status.className = "status error";
    status.textContent = "例文データを読み込めませんでした。ページを再読み込みしてください。";
    console.error(error);
  }
}

init();
