// --- スムーズスクロール機能 ---
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.length > 1 && document.querySelector(href)) {
                e.preventDefault();
                const target = document.querySelector(href);
                // ヘッダーの高さを取得（なければ60px程度を仮定）
                let header = document.querySelector('.header');
                let headerHeight = header ? header.offsetHeight : 60;
                // スクロール位置を計算
                const targetY = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 10; // 10px余裕
                window.scrollTo({ top: targetY, behavior: 'smooth' });
                // アドレスバーのハッシュも更新
                history.replaceState(null, null, href);
            }
        });
    });
});

var requestOptions = {
    method: 'GET',
    redirect: 'follow'
};

function device() {
    return /iPad/.test(navigator.userAgent) ? "tablet" : /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Silk/.test(navigator.userAgent) ? "mobile" : "desktop";
}

const workspace = document.querySelector(".workspace");

// 例文テストのデータ読み込み
let en_sample_test_data;
const en_sample_test_select = document.querySelector('select[name="en-sample-test"]');
en_sample_test_select.addEventListener("click", async () => {
    if (en_sample_test_data) return;
    const response = await fetch("en_sample_test.json");
    const data = await response.json();
    en_sample_test_data = data;
    let count = 0;
    for (var i of data.lessonTitles) {
        const option = document.createElement("option");
        option.value = count;
        option.textContent = i;
        en_sample_test_select.appendChild(option);
        count++;
    }
});

en_sample_test_select.addEventListener("change", () => {
    document.querySelector("div.description > a").style.pointerEvents = "auto";
});

// 漢字テストのデータ読み込み
let kanji_test_file_names;
const ja_kanji_test_select = document.querySelector('select[name="ja-kanji-test"]');
ja_kanji_test_select.addEventListener("click", async () => {
    if (kanji_test_file_names) { return; }
    fetch("https://script.google.com/macros/s/AKfycbyuKss_lBGHfZpyDO59TnHihiobJCLvBcigUETz9Md6rnl4vpbiTVuwK4mFi6y5HfQYbA/exec?reqType=getAllFiles&reqFolder=ja_kanji_test", requestOptions)
        .then(response => response.json())
        .then(result => {
            kanji_test_file_names = result;
            let count = 0;
            for (var i of kanji_test_file_names) {
                const option = document.createElement("option");
                option.value = count;
                option.textContent = i;
                ja_kanji_test_select.appendChild(option);
                count++;
            }
        })
        .catch(error => console.log('error', error));
});

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char];
    });
}

function formatFormula(formula) {
    const safeFormula = escapeHtml(formula);
    const polyatomicBodies = ['CH3COO', 'HCO3', 'NH4', 'H3O', 'NO3', 'CO3', 'SO4', 'PO4'];
    const polyatomicBody = polyatomicBodies.find(body => safeFormula.startsWith(body));
    let body, charge;

    if (polyatomicBody) {
        body = polyatomicBody;
        charge = safeFormula.slice(polyatomicBody.length);
    } else {
        const chargeMatch = safeFormula.match(/(\d*[+-])$/);
        charge = chargeMatch ? chargeMatch[1] : '';
        body = charge ? safeFormula.slice(0, -charge.length) : safeFormula;
    }

    return body.replace(/(\d+)/g, '<sub>$1</sub>') + (charge ? `<sup>${charge}</sup>` : '');
}

function buildChemicalFormulaPrint(data) {
    const title = '化学式テスト対策プリント';
    const buildQuestion = (item, index, mode) => {
        const prompt = mode === 'ja-to-formula' ? escapeHtml(item[1]) : formatFormula(item[0]);
        const answerClass = mode === 'ja-to-formula' ? 'formula-answer' : 'name-answer';
        return `
            <div class="chemical-question">
                <span class="chemical-num">${index + 1}</span>
                <span class="chemical-prompt">${prompt}</span>
                <span class="chemical-answer ${answerClass}"></span>
            </div>`;
    };

    return `
        <section class="chemical-print-sheet">
            <div class="chemical-print-header">
                <h1>${title}</h1>
                <div class="chemical-name">名前：</div>
            </div>
            <div class="chemical-print-columns">
                <section class="chemical-print-column">
                    <h2>日本語から化学式を書く問題</h2>
                    <div class="chemical-questions">
                        ${data.map((item, index) => buildQuestion(item, index, 'ja-to-formula')).join('')}
                    </div>
                </section>
                <section class="chemical-print-column">
                    <h2>化学式から日本語を書く問題</h2>
                    <div class="chemical-questions">
                        ${data.map((item, index) => buildQuestion(item, index, 'formula-to-ja')).join('')}
                    </div>
                </section>
            </div>
        </section>`;
}

async function create(name) {
    let print_title, html;
    if (name === "en-sample-test") {
        print_title = `${en_sample_test_data.lessonTitles[en_sample_test_select.value]} 例文テスト対策プリント`;
        let data = en_sample_test_data.englishSentencesData[en_sample_test_select.value];
        html = `<h1>${print_title}</h1>`;
        data.forEach((item, index) => {
            html += `
            <table border="1">
  <tr>
    <td class="s_num">${index + 1}</td>
    <td class="s_main">
      <div class="sample_container">${item[1]}</div>
    </td>
  </tr>
  </table>
`
        });
        html += ``;
    } else if (name === "chemical-formula") {
        print_title = '化学式テスト対策プリント';
        const response = await fetch('chemical-formula.json');
        const data = await response.json();
        html = buildChemicalFormulaPrint(data);
    }
    if (!html) return;
    workspace.innerHTML = html;
    // pcならprint()、スマホならhtml2pdf()でPDF化

    if (device() === "desktop") {
        window.print();
    } else {
        workspace.style.display = "block"; // workspaceを表示
        html2pdf().set({
            pagebreak: { mode: name === "chemical-formula" ? ['css', 'legacy'] : ['avoid-all', 'css', 'legacy'] },
            margin: name === "chemical-formula" ? 5 : 10, // mm単位（上下左右すべて）
            filename: `${print_title}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(workspace).save();
        requestAnimationFrame(() => {
            workspace.style.display = "none"; // PDF化が完了したらworkspaceを非表示にする
        });
    }
}

function __download(name) {
    if (name == "ja-kanji-test") {
        if (!ja_kanji_test_select.value) return;
        const file_name = kanji_test_file_names[ja_kanji_test_select.value];
        fetch("https://script.google.com/macros/s/AKfycbyuKss_lBGHfZpyDO59TnHihiobJCLvBcigUETz9Md6rnl4vpbiTVuwK4mFi6y5HfQYbA/exec?reqType=downloadURL&reqFolder=ja_kanji_test&filename=" + encodeURIComponent(file_name), requestOptions)
            .then(response => response.text())
            .then(result => location.href = result)
            .catch(error => console.log('error', error));
    }
}