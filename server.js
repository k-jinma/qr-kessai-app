const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os'); // 追加

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db', 'sales.json');

// publicフォルダ内の静的ファイル（HTML, CSS, JS）を配信する設定
app.use(express.static('public'));

// データベースファイルがなければ初期化
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ sales: [] }), 'utf8');
}

// ① 決済処理のエンドポイント
app.get('/purchase', (req, res) => {
  
  const { itemId, price, itemName } = req.query;

  if (!price || !itemName) {
    return res.status(400).send('商品情報が不足しています。');
  }

  // データベースファイルを読み込む
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  
  // 新しい売上データを作成
  const newSale = {
    id: Date.now(), // ユニークなIDとしてタイムスタンプを利用
    itemId: itemId,
    itemName: decodeURIComponent(itemName), // URLエンコードされた商品名をデコード
    price: Number(price),
    timestamp: new Date().toLocaleString('ja-JP'),
  };

  // 売上データを追加してファイルに保存
  db.sales.unshift(newSale); // 配列の先頭に追加
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

  console.log('売上が記録されました:', newSale);

  // 購入完了ページを返す
// 購入完了ページを返し、音声再生機能を追加
res.send(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>決済完了</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { text-align: center; margin-top: 50px; font-family: sans-serif; }
        .container { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        #autoplay-notice { font-size: 0.9em; color: #888; margin-top: 30px; display: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>お買い上げありがとうございます！</h1>
        <p>${newSale.itemName} (${newSale.price}円) の決済が完了しました。</p>
        <p><a href="/history.html">売上履歴を確認する</a></p>
        <p id="autoplay-notice">（音が鳴らない場合は画面をタップしてください）</p>
      </div>

      <audio id="success-sound" src="/sounds/paypay_sound.mp3" preload="auto"></audio>

      <script>
        window.addEventListener('load', () => {
          const sound = document.getElementById('success-sound');
          const notice = document.getElementById('autoplay-notice');
          
          const playPromise = sound.play();

          if (playPromise !== undefined) {
            playPromise.catch(error => {
              // 自動再生が失敗した場合
              console.error('音声の自動再生がブロックされました:', error);
              notice.style.display = 'block'; // 注意書きを表示
              // 画面をクリックしたら再生するイベントを追加
              document.body.addEventListener('click', () => {
                sound.play();
                notice.style.display = 'none';
              }, { once: true });
            });
          }
        });
      </script>
    </body>
    </html>
  `);
});

// ② 売上履歴を返すエンドポイント
app.get('/api/history', (req, res) => {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  res.json(db.sales);
});

// IPアドレスを取得する関数
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    for (const network of networkInterface) {
      if (network.family === 'IPv4' && !network.internal) {
        return network.address;
      }
    }
  }
  return 'localhost';
}

// IPアドレスを取得するAPIエンドポイント
app.get('/api/server-ip', (req, res) => {
  const localIP = getLocalIPAddress();
  res.json({ 
    ip: localIP, 
    port: PORT 
  });
});




// サーバーを起動
app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIPAddress();
  console.log(`サーバーが起動しました。 http://${localIP}:${PORT}`);
  console.log('スマホからは、PCのIPアドレスを指定してアクセスしてください。');
});