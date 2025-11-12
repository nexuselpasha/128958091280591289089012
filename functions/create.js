const fs = require('fs');
const path = require('path');
const licensesPath = path.join(__dirname, '../data/licenses.json');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { days = 30, product = "telegram_sender" } = JSON.parse(event.body);
  const key = "LS-" + Math.random().toString(36).substr(2, 8).toUpperCase();
  const expires = Math.floor(Date.now() / 1000) + (days * 86400);
  const created = Math.floor(Date.now() / 1000);

  // LİSANS OLUŞTUR VE HEMEN DÖNDÜR
  const newLicense = { key, product, expires, hwid: null, created };

  // licenses.json'a yaz (isteğe bağlı, sadece kayıt için)
  let licenses = [];
  try {
    const data = fs.readFileSync(licensesPath, 'utf8');
    licenses = JSON.parse(data);
  } catch (e) {}
  licenses.push(newLicense);
  try {
    fs.writeFileSync(licensesPath, JSON.stringify(licenses, null, 2));
  } catch (e) {
    console.log("Yazma hatası, ama lisans geçerli:", e);
  }

  // HEMEN DÖNDÜR → index.html undefined almaz
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newLicense)
  };
};