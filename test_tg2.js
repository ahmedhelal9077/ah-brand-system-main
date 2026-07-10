const fs = require('fs');

async function test() {
  const token = '8685098266:AAFe2xA4AID_3ir3IwKEucAlxroBKqMf2Tk';
  const chatId = '-1003924082513';
  
  // 1x1 png base64
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const buffer1 = Buffer.from(pngBase64, 'base64');
  
  const formData = new FormData();
  formData.append('chat_id', chatId);
  
  const blob1 = new Blob([new Uint8Array(buffer1)], { type: 'image/png' });
  const blob2 = new Blob([new Uint8Array(buffer1)], { type: 'image/png' });
  
  formData.append('photo0', blob1, 'photo0.png');
  formData.append('photo1', blob2, 'photo1.png');
  
  const mediaGroup = [
    { type: 'photo', media: 'attach://photo0', caption: 'Test Invoice Caption\n\nTotal: 500 EGP' },
    { type: 'photo', media: 'attach://photo1', caption: 'Product 1' }
  ];
  
  formData.append('media', JSON.stringify(mediaGroup));
  
  const res = await fetch('https://api.telegram.org/bot' + token + '/sendMediaGroup', {
    method: 'POST',
    body: formData
  });
  
  const text = await res.text();
  console.log('Result:', text);
}

test();
