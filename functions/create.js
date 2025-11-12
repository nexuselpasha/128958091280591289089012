const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { days = 30 } = JSON.parse(event.body);
  const key = "LS-" + Math.random().toString(36).substr(2, 8).toUpperCase();
  const expires = Math.floor(Date.now() / 1000) + (days * 86400);
  const created = Math.floor(Date.now() / 1000);

  const newLicense = { key, product: "telegram_sender", expires, hwid: null, created };

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = process.env.REPO;
  const PATH = "data/licenses.json";

  try {
    // Mevcut dosyayı al (SHA için)
    const fileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'netlify' }
    });

    let licenses = [];
    let sha = null;

    if (fileRes.ok) {
      const fileData = await fileRes.json();
      licenses = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
      sha = fileData.sha;
    } else {
      // Dosya yoksa, yeni oluştur
      licenses = [];
    }

    licenses.push(newLicense);

    // GitHub'a yaz (SHA varsa, yoksa yeni)
    const putBody = {
      message: `Lisans eklendi: ${key}`,
      content: Buffer.from(JSON.stringify(licenses, null, 2)).toString('base64'),
      branch: "main"
    };

    if (sha) {
      putBody.sha = sha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
      method: 'PUT',
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'netlify' },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      console.error('GitHub Error:', err);
      throw new Error(err.message || 'Yazma hatası');
    }

    // HEMEN DÖNDÜR (index.html undefined almaz)
    return { statusCode: 200, body: JSON.stringify(newLicense) };
  } catch (e) {
    console.error('Create Error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
