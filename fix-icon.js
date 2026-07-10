const sharp = require('sharp');

async function fix() {
  await sharp('public/icon.png')
    .resize(512, 512)
    .toFormat('png')
    .toFile('public/icon-512.png');
    
  await sharp('public/icon.png')
    .resize(192, 192)
    .toFormat('png')
    .toFile('public/icon-192.png');
    
  console.log("Done");
}

fix();
