const fs = require('fs');
const path = require('path');
const licensesPath = path.join(__dirname, '../data/licenses.json');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const data = JSON.parse(event.body);
  const { key, hwid } = data;

  let licenses = [];
  try {
    licenses = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ valid: false, message: "DB Error" }) };
  }

  const license = licenses.find(l => l.key === key);
  if (!license) return { statusCode: 200, body: JSON.stringify({ valid: false, message: "Key not found" }) };
  if (Date.now() / 1000 > license.expires) return { statusCode: 200, body: JSON.stringify({ valid: false, message: "Expired" }) };
  if (license.hwid && license.hwid !== hwid) return { statusCode: 200, body: JSON.stringify({ valid: false, message: "HWID mismatch" }) };

  if (hwid && !license.hwid) {
    license.hwid = hwid;
    fs.writeFileSync(licensesPath, JSON.stringify(licenses, null, 2));
  }

  return { statusCode: 200, body: JSON.stringify({ valid: true, expires: license.expires }) };
};