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
let emailTwoFactor = null;
let emailSecondFactorStarting = false;
let emailSecondFactorVerified = false;
let emailSecondFactorPendingUid = null;
let keepLoginDialogOpen = false;

const TWO_FACTOR_API_URL = 'https://script.google.com/macros/s/AKfycbyV1UxQR_nGKNyNQWQ-nNqCr2VKY9P9idjI9x93u4NAcs05Mi9nvM_9PfU-G2LuaQbDZg/exec';

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

const setEmailTwoFactorStep = (active, emailValue = '') => {
    const passwordStep = document.getElementById('emailPasswordStep');
    const twoFactorStep = document.getElementById('emailTwoFactorStep');
    const twoFactorInput = document.getElementById('loginTwoFactorCode');
    const twoFactorHelpText = document.getElementById('twoFactorHelpText');
    const backButton = document.getElementById('emailTwoFactorBackBtn');
    const modeButton = document.getElementById('emailLoginModeBtn');
    const googleButton = document.querySelector('.login-google-btn');
    const separator = document.querySelector('.login-separator');

    passwordStep?.classList.toggle('active', !active);
    twoFactorStep?.classList.toggle('active', active);
    if (backButton) backButton.hidden = !active;
    if (modeButton) modeButton.hidden = active;
    if (googleButton) googleButton.hidden = active;
    if (separator) separator.hidden = active;
    googleButton?.classList.toggle('login-hidden', active);
    separator?.classList.toggle('login-hidden', active);
    if (twoFactorInput) {
        twoFactorInput.required = active;
        if (!active) twoFactorInput.value = '';
    }
    if (twoFactorHelpText) {
        twoFactorHelpText.textContent = active
            ? `${emailValue} に送信された6桁の認証コードを入力してください。`
            : '';
    }
};

const extractTwoFactorId = (data) => {
    if (typeof data === 'string') return data;
    if (typeof data?.body === 'string') return data.body;
    if (typeof data?.result === 'string') return data.result;
    if (typeof data?.result?.body === 'string') return data.result.body;
    if (typeof data?.data === 'string') return data.data;

    return data?.id
        || data?.body?.id
        || data?.result?.id
        || data?.result?.body?.id
        || data?.data?.id
        || null;
};

const isTwoFactorVerified = (data) => {
    const value = data?.verified
        ?? data?.success
        ?? data?.ok
        ?? data?.body?.verified
        ?? data?.body?.success
        ?? data?.result?.verified
        ?? data?.result?.success
        ?? data?.result?.body?.verified
        ?? data?.result?.body?.success;

    if (typeof data === 'string') return ['true', 'ok', 'success', 'verified'].includes(data.toLowerCase());
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return ['true', 'ok', 'success', 'verified'].includes(value.toLowerCase());
    return false;
};

const postTwoFactor = async (body) => {
    const response = await fetch(TWO_FACTOR_API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(body),
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        throw new Error('2FAレスポンスの読み取りに失敗しました。');
    }

    if (!response.ok || data?.error || data?.result?.error) {
        throw new Error(data?.error || data?.result?.error || '2FA APIでエラーが発生しました。');
    }

    return data;
};

const resetEmailTwoFactor = () => {
    emailTwoFactor = null;
    emailSecondFactorStarting = false;
    emailSecondFactorVerified = false;
    emailSecondFactorPendingUid = null;
    keepLoginDialogOpen = false;
    setEmailTwoFactorStep(false);
};

const updateEmailAuthMode = () => {
    const submitButton = document.getElementById('emailLoginSubmit');
    const modeButton = document.getElementById('emailLoginModeBtn');
    const passwordInput = document.getElementById('loginPassword');

    if (submitButton) {
        submitButton.textContent = emailTwoFactor ? '認証してログイン' : (emailAuthMode === 'signin' ? 'メールアドレスでログイン' : 'メールアドレスで新規登録');
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
    resetEmailTwoFactor();
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
    if (emailSecondFactorPendingUid && !emailSecondFactorVerified) {
        signOut(auth).catch((error) => console.error('2FAキャンセル時のログアウトに失敗:', error));
    }
    resetEmailTwoFactor();
    if (typeof loginDialog.close === 'function') {
        loginDialog.close();
    } else {
        loginDialog.removeAttribute('open');
    }
};

window.toggleEmailAuthMode = () => {
    emailAuthMode = emailAuthMode === 'signin' ? 'signup' : 'signin';
    setLoginError();
    resetEmailTwoFactor();
    updateEmailAuthMode();
};

window.cancelEmailTwoFactor = async () => {
    setLoginError();
    if (emailSecondFactorPendingUid && !emailSecondFactorVerified) {
        await signOut(auth);
    }
    resetEmailTwoFactor();
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
    const twoFactorInput = document.getElementById('loginTwoFactorCode');
    if (!emailInput || !passwordInput) return;

    loginInProgress = true;
    setLoginBusy(true);
    setLoginError();

    try {
        const emailValue = emailInput.value.trim();
        const passwordValue = passwordInput.value;
        if (emailTwoFactor) {
            const codeValue = twoFactorInput?.value.trim() || '';
            const verifyData = await postTwoFactor({
                type: '2fa_verify',
                id: emailTwoFactor.id,
                email: emailTwoFactor.email,
                code: codeValue,
            });

            if (!isTwoFactorVerified(verifyData)) {
                await signOut(auth);
                resetEmailTwoFactor();
                updateEmailAuthMode();
                throw new Error('認証コードが正しくありません。もう一度メールアドレスとパスワードからログインしてください。');
            }

            emailSecondFactorVerified = true;
            console.log('メールログイン2FA認証完了:', auth.currentUser);
            passwordInput.value = '';
            resetEmailTwoFactor();
            refreshAccountUi(auth.currentUser);
            window.closeLoginDialog();
            return;
        }

        const result = emailAuthMode === 'signin'
            ? await (async () => {
                emailSecondFactorStarting = true;
                keepLoginDialogOpen = true;
                return signInWithEmailAndPassword(auth, emailValue, passwordValue);
            })()
            : await createUserWithEmailAndPassword(auth, emailValue, passwordValue);

        console.log('メールログイン:', result.user);
        if (emailAuthMode === 'signin') {
            emailSecondFactorPendingUid = result.user.uid;
            emailSecondFactorVerified = false;
            keepLoginDialogOpen = true;
            refreshAccountUi(null);
            const requestData = await postTwoFactor({
                type: '2fa_request',
                email: emailValue,
            });
            const twoFactorId = extractTwoFactorId(requestData);
            if (!twoFactorId) {
                throw new Error('2FA認証IDを取得できませんでした。');
            }
            emailSecondFactorStarting = false;
            emailTwoFactor = {
                id: twoFactorId,
                email: emailValue,
            };
            setEmailTwoFactorStep(true, emailValue);
            updateEmailAuthMode();
            twoFactorInput?.focus();
        } else {
            passwordInput.value = '';
            window.closeLoginDialog();
        }
    } catch (e) {
        console.error('メールログインエラー:', e);
        if (emailSecondFactorPendingUid && !emailSecondFactorVerified && !emailTwoFactor) {
            await signOut(auth);
            resetEmailTwoFactor();
        } else if (!emailTwoFactor) {
            resetEmailTwoFactor();
        }
        emailSecondFactorStarting = false;
        setLoginError(e.code ? getAuthErrorMessage(e) : e.message);
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
            manageButton.style.display = 'inline-block';
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
        if (!keepLoginDialogOpen) {
            window.closeLoginDialog();
        }
    }
};

window.refreshAccountUi = refreshAccountUi;

// 状態監視
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user && (emailSecondFactorStarting || emailSecondFactorPendingUid === user.uid) && !emailSecondFactorVerified) {
        refreshAccountUi(null);
        return;
    }
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
