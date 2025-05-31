// 売上履歴を表示するテーブルの本体
const historyBody = document.getElementById('history-body');

// 売上履歴を取得してテーブルを更新する関数
async function fetchHistory() {
  try {
    const response = await fetch('/api/history');
    const sales = await response.json();

    // テーブルの中身を一旦空にする
    historyBody.innerHTML = '';

    // 取得したデータを行としてテーブルに追加
    sales.forEach(sale => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${sale.timestamp}</td>
        <td>${sale.itemName}</td>
        <td>${sale.price.toLocaleString()}</td>
      `;
      historyBody.appendChild(row);
    });

  } catch (error) {
    console.error('履歴の取得に失敗しました:', error);
    historyBody.innerHTML = '<tr><td colspan="3">データの読み込みに失敗しました。</td></tr>';
  }
}

// ページが読み込まれた時と、その後5秒ごとに履歴を自動更新
document.addEventListener('DOMContentLoaded', () => {
  fetchHistory(); // まず一度実行
  setInterval(fetchHistory, 5000); // 5秒ごとに実行
});