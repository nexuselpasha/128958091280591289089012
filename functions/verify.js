const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { key, hwid } = JSON.parse(event.body);
  const REPO = process.env.REPO;
  const RAW_URL = `https://raw.githubusercontent.com/${REPO}/main/data/licenses.json`;

  try {
    const res = await fetch(RAW_URL);
    if (!res.ok) throw new Error('Dosya alınamadı');

    const licenses = await res.json();
    const license = licenses.find(l => l.key === key);

    if (!license) return { statusCode: 200, body: JSON.stringify({ valid: false, message: "Key not found" }) };
    if (Date.now() / 1000 > license.expires) return { statusCode: 200, body: JSON.stringify({ valid: false, message: "Expired" }) };
    if (license.hwid && license.hwid !== hwid) return { statusCode: 200, body: JSON.stringify({ valid: false, message: "HWID mismatch" }) };

    // HWID KİLİTLEME (GİTHUB YAZMA – PRIVATE İÇİN TOKEN GEREKLİ, PUBLIC İÇİN YORUM SATIRI)
    if (hwid && !license.hwid) {
      console.log('HWID kilitleniyor...');  # PUBLIC İÇİN YAZMA İZİN YOK, MANUAL GÜNCELLE
      license.hwid = hwid;  # LOCAL GÜNCELLE, SUNUCU YENİ DEPOLAY
    }

    return { statusCode: 200, body: JSON.stringify({ valid: true, expires: license.expires }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ valid: false, message: "Sunucu hatası" }) };
  }
};
