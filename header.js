
fetch("/header.html")
    .then(response => response.text())
    .then(data => {
        document.querySelector(".header").innerHTML = data;
        const header_links = document.querySelector(".links");
        open_menu = () => {
            if (isOpen) {
                header_links.classList.remove("open");
            } else {
                header_links.classList.add("open");
            }
            isOpen = !isOpen;
        }
        // 自動でアカウント管理スクリプトを読み込む（ページによっては含まれていないため）
        if (!document.querySelector('script[data-account-manager]')) {
            const s = document.createElement('script');
            s.type = 'module';
            s.src = '/account_manager.js';
            s.setAttribute('data-account-manager', '1');
            document.body.appendChild(s);
            s.onload = accountManagerLoaded;
        }
        if (window.refreshAccountUi) {
            window.refreshAccountUi();
        }
    });

let isOpen = false;
let open_menu;

let accountCard;
let closeButton;
let restoreBtn;
let safeSearchStatus;
let toast;

let closeAccountPanel = () => {
    accountCard.classList.add('gam-hidden-card');
    accountCard.style.opacity = '0';
    setTimeout(() => {
        restoreBtn.style.display = 'block';
    }, 300);
}

let openPanel = () => {
    accountCard = document.getElementById('accountMenu');
    closeButton = document.getElementById('closeButton');
    restoreBtn = document.getElementById('restoreBtn');
    safeSearchStatus = document.getElementById('mailStats');
    toast = document.getElementById('actionToast');

    restoreBtn.style.display = 'none';
    accountCard.classList.remove('gam-hidden-card');
    accountCard.style.display = 'flex';
    requestAnimationFrame(() => {
        accountCard.style.opacity = '1';
    });

    // クローズボタンのクリックでパネルを閉じる
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation(); // イベントの伝播を防ぐ
        closeAccountPanel();
        document.removeEventListener('click', closeOnClickOutside);
    });

    // パネル外をクリックしたら閉じる
    const closeOnClickOutside = (e) => {
        if (!accountCard.contains(e.target) && !document.querySelector('.user-icon').contains(e.target)) {
            closeAccountPanel();
            document.removeEventListener('click', closeOnClickOutside);
        }
    };

    document.addEventListener('click', closeOnClickOutside);
}


accountManagerLoaded = () => {
    if (window.refreshAccountUi) {
        window.refreshAccountUi();
    }
};

// メール通知のトグル切り替え
let isSafeSearchOn = false;
function toggleSafeSearch() {
    isSafeSearchOn = !isSafeSearchOn;
    if (isSafeSearchOn) {
        safeSearchStatus.textContent = 'オン';
        safeSearchStatus.classList.add('gam-active');
    } else {
        safeSearchStatus.textContent = 'オフ';
        safeSearchStatus.classList.remove('gam-active');
    }
    window.setMailNotification(isSafeSearchOn);
}

// メッセージを表示するトースト機能
let toastTimeout;
function simulateAction(message) {
    console.log(message);

    // すでに表示中のタイマーがあればリセット
    clearTimeout(toastTimeout);

    // テキストを更新してクラスを追加
    toast.textContent = message;
    toast.classList.add('gam-show');

    // 2.5秒後に閉じる
    toastTimeout = setTimeout(() => {
        toast.classList.remove('gam-show');
    }, 2500);
}
