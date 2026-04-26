// --- スムーズスクロール機能 ---
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
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

function create(name) {
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
    }
    workspace.innerHTML = html;
    // pcならprint()、スマホならhtml2pdf()でPDF化

    if (device() === "desktop") {
        window.print();
    } else {
        workspace.style.display = "block"; // workspaceを表示
        html2pdf().set({
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            margin: 10, // mm単位（上下左右すべて）
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