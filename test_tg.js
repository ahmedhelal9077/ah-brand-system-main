const fs = require('fs');

async function test() {
  const token = '8685098266:AAFe2xA4AID_3ir3IwKEucAlxroBKqMf2Tk';
  const chatId = '-1003924082513';
  
  const formData = new FormData();
  formData.append('chat_id', chatId);
  
  const mediaGroup = [
    { type: 'photo', media: 'https://placehold.co/600x400.png', caption: 'Test Invoice Caption\n\nTotal: 500 EGP' },
    { type: 'photo', media: 'https://placehold.co/600x400.png', caption: 'Product 1' }
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
