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

let loadingCount = 0;

function showLoadingMessage() {
    let indicator = document.querySelector('.loading-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'loading-indicator';
        indicator.setAttribute('role', 'status');
        indicator.setAttribute('aria-live', 'polite');
        indicator.textContent = 'データを読み込んでいます…';
        document.body.appendChild(indicator);
    }
    loadingCount += 1;
    indicator.classList.add('is-visible');
}

function hideLoadingMessage() {
    const indicator = document.querySelector('.loading-indicator');
    if (!indicator) return;
    loadingCount = Math.max(0, loadingCount - 1);
    if (loadingCount === 0) {
        indicator.classList.remove('is-visible');
    }
}

async function fetchJsonWithLoading(url, options) {
    showLoadingMessage();
    try {
        const response = await fetch(url, options);
        return await response.json();
    } finally {
        hideLoadingMessage();
    }
}

async function fetchTextWithLoading(url, options) {
    showLoadingMessage();
    try {
        const response = await fetch(url, options);
        return await response.text();
    } finally {
        hideLoadingMessage();
    }
}

// 例文テストのデータ読み込み
let en_sample_test_data;
const en_sample_test_select = document.querySelector('select[name="en-sample-test"]');
async function loadEnSampleTestData() {
    if (en_sample_test_data) return;
    const data = await fetchJsonWithLoading("en_sample_test.json");
    en_sample_test_data = data;
    data.lessonTitles.forEach((title, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = title;
        en_sample_test_select.appendChild(option);
    });
}

en_sample_test_select.addEventListener("click", loadEnSampleTestData);
en_sample_test_select.addEventListener("focus", loadEnSampleTestData);

en_sample_test_select.addEventListener("change", () => {
    document.querySelector("div.description > a").style.pointerEvents = "auto";
});

// 単語テストのデータ読み込み
let crown_tango_test_data;
const crown_tango_test_select = document.querySelector('select[name="crown-tango-test"]');
crown_tango_test_select.addEventListener("click", async () => {
    if (crown_tango_test_data) return;
    const data = await fetchJsonWithLoading("crown-tango.json");
    crown_tango_test_data = data;
    let count = 0;
    for (var i in data) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        crown_tango_test_select.appendChild(option);
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
    fetchJsonWithLoading("https://script.google.com/macros/s/AKfycbyuKss_lBGHfZpyDO59TnHihiobJCLvBcigUETz9Md6rnl4vpbiTVuwK4mFi6y5HfQYbA/exec?reqType=getAllFiles&reqFolder=ja_kanji_test", requestOptions)
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

// 数学補助テキストのデータ読み込み
let sub_text_file_names;
const math_sub_text = document.querySelector('select[name="math-sub-text"]');
math_sub_text.addEventListener("click", async () => {
    if (sub_text_file_names) { return; }
    fetchJsonWithLoading("https://script.google.com/macros/s/AKfycbyuKss_lBGHfZpyDO59TnHihiobJCLvBcigUETz9Md6rnl4vpbiTVuwK4mFi6y5HfQYbA/exec?reqType=getAllFiles&reqFolder=math-sub-text", requestOptions)
        .then(result => {
            sub_text_file_names = result;
            let count = 0;
            for (var i of sub_text_file_names) {
                const option = document.createElement("option");
                option.value = count;
                option.textContent = i;
                math_sub_text.appendChild(option);
                count++;
            }
        })
        .catch(error => console.log('error', error));
});

// 速読英単語テストの入力
const sokutan_start_input = document.querySelector('input[name="sokutan-start"]');
const sokutan_end_input = document.querySelector('input[name="sokutan-end"]');

// 速読英単語 データ
async function generateSokutanData(start, end) {
    const data = await fetchJsonWithLoading("sokutan.json");
    if (
        start < 1 ||
        end > data.AllQuestList.length ||
        start > end
    ) {
        return alert(
            `start/end が範囲外です: start=${start}, end=${end}, length=${data.AllQuestList.length}`
        );
    }
    const picked_data = data.AllQuestList.slice(start - 1, end).map(i => [i.qt08[0].Quest_sentence.replace("\n", "<br>"), i.qt08[0].AnsStr]);
    let return_data = `<h1>速読英単語 ${start} ~ ${end} 単語テスト</h1><ol>`;
    picked_data.forEach((item, index) => {
        return_data += `<li style="padding: 10px;">${item[0]}</li>`;
    });
    return_data += "</ol><h2>答え</h2><ol style='column-count: 5'>";
    picked_data.forEach((item, index) => {
        return_data += `<li style="padding: 5px;">${item[1]}</li>`;
    });
    return_data += "</ol>";
    return return_data
}

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
        if (!en_sample_test_data) {
            await loadEnSampleTestData();
        }
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
    } else if (name === "en-sample-test-answer") {
        if (!en_sample_test_data) {
            await loadEnSampleTestData();
        }
        print_title = `${en_sample_test_data.lessonTitles[en_sample_test_select.value]} 例文テスト解答プリント`;
        let data = en_sample_test_data.englishSentencesData[en_sample_test_select.value];
        html = `<h1>${print_title}</h1>`;
        data.forEach((item, index) => {
            html += `
            <table border="1" class="answer_sheet_table">
  <tr>
    <td class="s_num">${index + 1}</td>
    <td class="s_main">
      <div class="sample_container answer_sheet">${item[1]}<br><strong>解答:</strong> ${item[0]}</div>
    </td>
  </tr>
  </table>
`
        });
    } else if (name === "crown-tango-test") {
        print_title = `Crown ${crown_tango_test_select.value} 単語テスト`;
        console.log(print_title);
        workspace.innerHTML = `<h1>${print_title}</h1>`;
        let data = crown_tango_test_data[crown_tango_test_select.value];
        let container = document.createElement("div");
        const ul = document.createElement("ol");
        ul.style.columnCount = 2;
        data.forEach((item, index) => {
            const container = document.createElement("div");
            container.style.breakInside = "avoid";
            const li = document.createElement("li");
            li.textContent = item[1];
            const underline_container = document.createElement("div");
            underline_container.style.width = "40vw";
            underline_container.style.height = "50px";
            underline_container.style.marginBottom = "10px"
            underline_container.style.borderBottom = "2px solid black";
            container.appendChild(li);
            container.appendChild(underline_container);
            ul.appendChild(container);
        });
        workspace.appendChild(ul);
        let answer_container = document.createElement("div");
        answer_container.style.breakInside = "avoid";
        let break_after_div = document.createElement("h2");
        break_after_div.textContent = "解答";
        answer_container.appendChild(break_after_div);
        let answer_div = document.createElement("ol");
        answer_div.style.columnCount = 4;
        data.forEach((item, index) => {
            const li = document.createElement("li");
            li.textContent = item[0];
            li.style.marginBottom = "10px";
            answer_div.appendChild(li);
        });
        answer_container.appendChild(answer_div);
        workspace.appendChild(answer_container);
        html = workspace.innerHTML;
    } else if (name === "chemical-formula") {
        print_title = '化学式テスト対策プリント';
        const data = await fetchJsonWithLoading('chemical-formula.json');
        html = buildChemicalFormulaPrint(data);
    } else if (name == "sokutan") {
        const start = Number(sokutan_start_input.value);
        const end = Number(sokutan_end_input.value);
        print_title = `Sokutan ${start} - ${end}`;
        html = await generateSokutanData(start, end);
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
    let file_name;
    if (name == "ja-kanji-test") {
        if (!ja_kanji_test_select.value) return;
        file_name = kanji_test_file_names[ja_kanji_test_select.value];
    }
    if (name == "math-sub-text") {
        if (!math_sub_text.value) return;
        file_name = sub_text_file_names[math_sub_text.value];
    }
    fetchTextWithLoading("https://script.google.com/macros/s/AKfycbyuKss_lBGHfZpyDO59TnHihiobJCLvBcigUETz9Md6rnl4vpbiTVuwK4mFi6y5HfQYbA/exec?reqType=downloadURL&reqFolder=" + name + "&filename=" + encodeURIComponent(file_name), requestOptions)
        .then(result => location.href = result)
        .catch(error => console.log('error', error));
}
