import {readFile, writeFile} from 'node:fs/promises';
const root = new URL('./', import.meta.url);
try {
 const config = JSON.parse(await readFile(new URL('config.local.json', root), 'utf8'));
 const client = config.googleOAuthClientId;
 if (typeof client !== 'string' || client.startsWith('REPLACE_') || !/^[a-zA-Z0-9-]+\.apps\.googleusercontent\.com$/.test(client)) throw Error('googleOAuthClientId không hợp lệ.');
 const manifest = JSON.parse(await readFile(new URL('manifest.template.json', root), 'utf8'));
 manifest.oauth2.client_id = client;
 await writeFile(new URL('manifest.json', root), JSON.stringify(manifest, null, 2) + '\n');
 console.log('Đã tạo manifest.json. Có thể Load unpacked thư mục này trong Chrome.');
} catch (error) {
 console.error('Cấu hình thất bại: ' + error.message + '\nSao chép config.example.json thành config.local.json, điền Client ID rồi chạy node configure.mjs.');
 process.exitCode = 1;
}
