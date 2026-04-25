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
