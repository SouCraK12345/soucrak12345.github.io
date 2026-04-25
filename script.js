// カルーセル

let carousel_index = 0;
let max_index = 3;
let carousel = document.querySelector(".carousel");
let carousel_interval;

carousel.style.width = `${max_index * 100}dvw`;
function updateCarousel() {
    carousel.style.transform = `translateX(-${(carousel_index % max_index) * 100}dvw)`;
    setCarouselInterval();
}
document.querySelector("body > div.carousel-container > div:nth-child(1)").addEventListener("click", () => {
    carousel_index--;
    updateCarousel();
});
document.querySelector("body > div.carousel-container > div:nth-child(2)").addEventListener("click", () => {
    carousel_index++;
    updateCarousel();
});

function setCarouselInterval() {
    clearInterval(carousel_interval);
    carousel_interval = setInterval(() => {
        carousel_index++
        updateCarousel();
    }, 10000)
}

setCarouselInterval();

// ノート

function createArticle({
  imgSrc,
  title,
  description,
  linkHref,
  linkText
} = {}) {

  const article = document.createElement("div");
  article.className = "article";

  // img（あれば）
  if (imgSrc) {
    const img = document.createElement("img");
    img.src = imgSrc;
    article.appendChild(img);
  }

  // main（中身がある場合のみ作る）
  if (title || description || linkHref) {
    const main = document.createElement("main");

    // h3（あれば）
    if (title) {
      const h3 = document.createElement("h3");
      h3.innerHTML = title;
      main.appendChild(h3);
    }

    // p（あれば）
    if (description || linkHref) {
      const p = document.createElement("p");

      if (description) {
        p.innerHTML = description;
      }

      if (linkHref) {
        const a = document.createElement("a");
        a.href = linkHref;
        a.innerHTML = linkText || "サイトを開く";
        p.appendChild(a);
      }

      main.appendChild(p);
    }

    article.appendChild(main);
  }

  return article;
}

const article_container = document.querySelector(".articles");
document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch("articles/articles.json");
    const data = await response.json();
    data.slice(-2).reverse().forEach(item => {
        const el = createArticle(item);
        article_container.appendChild(el);
    });
});