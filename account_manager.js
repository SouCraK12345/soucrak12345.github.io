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
    authDomain: 'nanzan-home.firebaseapp.com',
    projectId: 'nanzan-home',
    storageBucket: 'nanzan-home.firebasestorage.app',
    messagingSenderId: '19657265870',
    appId: '1:19657265870:web:da9a6372f644bff25fb69f',
    measurementId: 'G-9BV2543QVK',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
let loginInProgress = false;

// Googleログイン
window.googleLogin = async () => {
    const login_button = document.querySelector('.account > button');
    if (loginInProgress) return;

    loginInProgress = true;
    if (login_button) login_button.disabled = true;

    try {
        const result = await signInWithPopup(auth, provider);
        console.log('Googleログイン:', result.user);
    } catch (e) {
        console.error('Googleログインエラー:', e);
        if (e.code === 'auth/too-many-requests' || String(e.message).includes('429')) {
            // alert('Too Many Requests が発生しました。しばらく待ってから再度お試しください。');
        }
    } finally {
        loginInProgress = false;
        if (login_button) login_button.disabled = false;
    }
};

// ログアウト
window.logout = async () => {
    await signOut(auth);
};

// 状態監視
onAuthStateChanged(auth, (user) => {
    let login_button = document.querySelector(".account > button");
    let user_icon = document.querySelector(".user-icon");
    const status = document.getElementById('status');
    if (user) {
        console.log(`ログイン中: ${user.email || user.displayName}`);
        user_icon.style.display = "inline-block";
        user_icon.src = user.photoURL || "../Assets/kkrn_icon_user_14.png";
        document.querySelector("#accountMenu > div.gam-header > div.gam-avatar-container > img").src = user.photoURL || "../Assets/kkrn_icon_user_14.png";
        document.querySelector("#accountMenu > div.gam-header > div.gam-email-display").textContent = user.email || "ユーザー";
        document.querySelector("#accountMenu > div.gam-header > div.gam-user-name").textContent = user.displayName || "ユーザー";
        login_button.style.display = "none";
    } else {
        console.log('未ログイン');
        login_button.style.display = "inline-block";
        user_icon.style.display = "none";
    }
});
