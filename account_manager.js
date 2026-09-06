import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: 'AIzaSyADIfO9MyeV0-QePXPg4PWTn0_JeuH3_mU',
    authDomain: 'auth.soucrak.f5.si',
    projectId: 'nanzan-home',
    storageBucket: 'nanzan-home.firebasestorage.app',
    messagingSenderId: '19657265870',
    appId: '1:19657265870:web:da9a6372f644bff25fb69f',
    measurementId: 'G-9BV2543QVK',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let token;
let uid;
let email;
let logged_in = false;
let currentUser = null;

const provider = new GoogleAuthProvider();
let loginInProgress = false;
let emailAuthMode = 'signin';

const getLoginDialog = () => document.getElementById('loginDialog');
const getLoginError = () => document.getElementById('loginError');

const setLoginError = (message = '') => {
    const loginError = getLoginError();
    if (loginError) loginError.textContent = message;
};

const setLoginBusy = (busy) => {
    document.querySelectorAll('#loginDialog button, #loginDialog input').forEach((element) => {
        element.disabled = busy;
    });
};

const updateEmailAuthMode = () => {
    const submitButton = document.getElementById('emailLoginSubmit');
    const modeButton = document.getElementById('emailLoginModeBtn');
    const passwordInput = document.getElementById('loginPassword');

    if (submitButton) {
        submitButton.textContent = emailAuthMode === 'signin' ? 'メールアドレスでログイン' : 'メールアドレスで新規登録';
    }
    if (modeButton) {
        modeButton.textContent = emailAuthMode === 'signin' ? '新規登録に切り替え' : 'ログインに戻る';
    }
    if (passwordInput) {
        passwordInput.autocomplete = emailAuthMode === 'signin' ? 'current-password' : 'new-password';
    }
};

const getAuthErrorMessage = (error) => {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'このメールアドレスはすでに登録されています。';
        case 'auth/invalid-email':
            return 'メールアドレスの形式が正しくありません。';
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'メールアドレスまたはパスワードが違います。';
        case 'auth/weak-password':
            return 'パスワードは6文字以上にしてください。';
        case 'auth/popup-closed-by-user':
            return 'Googleログインがキャンセルされました。';
        case 'auth/too-many-requests':
            return '試行回数が多すぎます。しばらく待ってから再度お試しください。';
        default:
            return 'ログインに失敗しました。時間をおいて再度お試しください。';
    }
};

window.openLoginDialog = () => {
    const loginDialog = getLoginDialog();
    if (!loginDialog) return;

    setLoginError();
    updateEmailAuthMode();
    if (typeof loginDialog.showModal === 'function') {
        loginDialog.showModal();
    } else {
        loginDialog.setAttribute('open', '');
    }
};

window.closeLoginDialog = () => {
    const loginDialog = getLoginDialog();
    if (!loginDialog) return;

    setLoginError();
    if (typeof loginDialog.close === 'function') {
        loginDialog.close();
    } else {
        loginDialog.removeAttribute('open');
    }
};

window.toggleEmailAuthMode = () => {
    emailAuthMode = emailAuthMode === 'signin' ? 'signup' : 'signin';
    setLoginError();
    updateEmailAuthMode();
};

// Googleログイン
window.googleLogin = async () => {
    const login_button = document.querySelector('.account > button');
    if (loginInProgress) return;

    loginInProgress = true;
    if (login_button) login_button.disabled = true;
    setLoginBusy(true);
    setLoginError();

    try {
        const result = await signInWithPopup(auth, provider);
        console.log('Googleログイン:', result.user);
        window.closeLoginDialog();
    } catch (e) {
        console.error('Googleログインエラー:', e);
        setLoginError(getAuthErrorMessage(e));
    } finally {
        loginInProgress = false;
        if (login_button) login_button.disabled = false;
        setLoginBusy(false);
    }
};

window.emailLogin = async (event) => {
    event.preventDefault();
    if (loginInProgress) return;

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    if (!emailInput || !passwordInput) return;

    loginInProgress = true;
    setLoginBusy(true);
    setLoginError();

    try {
        const emailValue = emailInput.value.trim();
        const passwordValue = passwordInput.value;
        const result = emailAuthMode === 'signin'
            ? await signInWithEmailAndPassword(auth, emailValue, passwordValue)
            : await createUserWithEmailAndPassword(auth, emailValue, passwordValue);

        console.log('メールログイン:', result.user);
        passwordInput.value = '';
        window.closeLoginDialog();
    } catch (e) {
        console.error('メールログインエラー:', e);
        setLoginError(getAuthErrorMessage(e));
    } finally {
        loginInProgress = false;
        setLoginBusy(false);
    }
};

// ログアウト
window.logout = async () => {
    closeAccountPanel();
    await signOut(auth);
};

const refreshAccountUi = (user = currentUser) => {
    let login_button = document.querySelector(".account > button");
    let user_icon = document.querySelector(".user-icon");
    let accountMenu = document.getElementById('accountMenu');
    if (!login_button || !user_icon || !accountMenu) return;

    const status = document.getElementById('status');
    logged_in = Boolean(user);
    if (user) {
        // console.log(user);
        token = user.accessToken;
        uid = user.uid;
        email = user.email;
        console.log(`ログイン中: ${user.email || user.displayName}`);
        user_icon.style.display = "inline-block";
        user_icon.src = user.photoURL || "../Assets/kkrn_icon_user_14.png";
        const menuAvatar = document.querySelector("#accountMenu > div.gam-header > div.gam-avatar-container > img");
        const menuEmail = document.querySelector("#accountMenu > div.gam-header > div.gam-email-display");
        const menuUserName = document.querySelector("#accountMenu > div.gam-header > div.gam-user-name");
        if (menuAvatar) menuAvatar.src = user.photoURL || "../Assets/kkrn_icon_user_14.png";
        if (menuEmail) menuEmail.textContent = user.email || "ユーザー";
        if (menuUserName) menuUserName.textContent = user.displayName || "ユーザー";
        const manageButton = document.getElementById('manageBtn');
        if (manageButton) {
            const usesGoogleProvider = user.providerData.some((providerInfo) => providerInfo.providerId === 'google.com');
            manageButton.style.display = usesGoogleProvider ? 'inline-block' : 'none';
        }
        login_button.style.display = "none";

        const safeSearchStatus = document.getElementById('mailStats');
        getMailNotification().then(response => response.json()).then(data => {
            const isEnabled = data.result.body;
            console.log(`メール通知: ${isEnabled ? 'オン' : 'オフ'} (サーバーから読み込み)`);
            isSafeSearchOn = isEnabled;
            if (isEnabled) {
                safeSearchStatus.textContent = 'オン';
                safeSearchStatus.classList.add('gam-active');
            } else {
                safeSearchStatus.textContent = 'オフ';
                safeSearchStatus.classList.remove('gam-active');
            }
        }).catch(error => {
            console.error('メール通知の状態の取得に失敗:', error);
        });
    } else {
        console.log('未ログイン');
        login_button.style.display = "inline-block";
        user_icon.style.display = "none";
        window.closeLoginDialog();
    }
};

window.refreshAccountUi = refreshAccountUi;

// 状態監視
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    refreshAccountUi(user);
});

window.getMailNotification = () => {
    const url = location.origin == "https://soucrak.f5.si" ? "https://api.soucrak.f5.si/gas/get" : "http://localhost:8787/gas/get";
    return fetch(`${url}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ path: `user.${uid}.mail.notification` }),
    });
};

window.setMailNotification = (enabled) => {
    console.log(`メール通知: ${enabled ? 'オン' : 'オフ'}`);
    fetch(location.origin == "https://soucrak.f5.si" ? "https://api.soucrak.f5.si/gas/post" : "http://localhost:8787/gas/post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
            path: `user.${uid}.mail`, value: {
                notification: enabled,
                email
            }
        }),
    });
}

window.isLoggedin = () => {
    return logged_in;
}
