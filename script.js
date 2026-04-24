let carousel_index = 0;
let max_index = 3;
let carousel = document.querySelector(".carousel");

carousel.style.width = `${max_index * 100}dvw`;
console.log(carousel.style.width);
function updateCarousel() {
    carousel.style.transform = `translateX(-${(carousel_index % max_index) * 100}dvw)`;
}
document.querySelector("body > div.carousel-container > div:nth-child(1)").addEventListener("click", () => {
    carousel_index--;
    updateCarousel();
});
document.querySelector("body > div.carousel-container > div:nth-child(2)").addEventListener("click", () => {
    carousel_index++;
    updateCarousel();
});
