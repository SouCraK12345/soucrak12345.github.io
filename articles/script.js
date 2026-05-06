const articleList = document.getElementById("article-list");
const articleTemplate = document.getElementById("article-card-template");
const articleCount = document.getElementById("article-count");
const visibleCount = document.getElementById("visible-count");
const resultText = document.getElementById("result-text");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("article-search");

let articles = [];

function isExternalUrl(value) {
    return /^https?:\/\//.test(value);
}

function resolveAssetPath(path) {
    if (!path || isExternalUrl(path) || path.startsWith("../") || path.startsWith("/")) {
        return path;
    }
    return `../${path}`;
}

function resolveLinkPath(path) {
    if (!path || isExternalUrl(path) || path.startsWith("../") || path.startsWith("/")) {
        return path;
    }
    return `../${path}`;
}

function createArticleCard(article, index) {
    const fragment = articleTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".article-card");
    const link = fragment.querySelector(".article-link");
    const image = fragment.querySelector("img");
    const title = fragment.querySelector("h3");
    const description = fragment.querySelector(".article-description");
    const cta = fragment.querySelector(".article-cta");

    link.href = resolveLinkPath(article.linkHref || "#");
    title.textContent = article.title || "Untitled";
    description.textContent = article.description || "";
    image.src = resolveAssetPath(article.imgSrc || "Assets/exam-docs.png");
    image.alt = article.title || "Article thumbnail";
    cta.firstChild.textContent = `${article.linkText || "サイトを見る"} `;
    card.style.animationDelay = `${index * 80}ms`;

    return fragment;
}

function updateSummary(visible) {
    articleCount.textContent = String(articles.length);
    visibleCount.textContent = String(visible.length);
    resultText.textContent = visible.length === articles.length
        ? ``
        : `検索結果: ${visible.length} 件`;
    emptyState.hidden = visible.length !== 0;
}

function renderArticles(query = "") {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
        ? articles.filter((article) => {
            const haystack = `${article.title || ""} ${article.description || ""}`.toLowerCase();
            return haystack.includes(normalizedQuery);
        })
        : articles;

    articleList.innerHTML = "";
    filtered.forEach((article, index) => {
        articleList.appendChild(createArticleCard(article, index));
    });
    updateSummary(filtered);
}

async function loadArticles() {
    try {
        const response = await fetch("./articles.json");
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        articles = Array.isArray(data) ? [...data].reverse() : [];
        renderArticles();
    } catch (error) {
        articleList.innerHTML = "";
        resultText.textContent = "ノートの読み込みに失敗しました。";
        emptyState.hidden = false;
        articleCount.textContent = "0";
        visibleCount.textContent = "0";
        console.error(error);
    }
}

searchInput.addEventListener("input", (event) => {
    renderArticles(event.target.value);
});

loadArticles();
