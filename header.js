
fetch("/header")
    .then(response => response.text())
    .then(data => {
        document.querySelector(".header").innerHTML = data;
        const header_links = document.querySelector(".links");
        open_menu = () => {
            if (isOpen) {
                header_links.classList.remove("open");
            }else{
                header_links.classList.add("open");
            }
            isOpen = !isOpen;
        }
    });

let isOpen = false;
let open_menu;