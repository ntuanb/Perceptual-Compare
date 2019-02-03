// Libs
const Nightmare         = require('nightmare')
const fs                = require('fs')
const Niffy             = require('niffy')
const PNG               = require('pngjs').PNG
const pixelmatch        = require('pixelmatch')
const { expect }        = require('chai');
const { send }          = require('./email.js');

// Constants
const URL = 'http://localhost:8081';
const SCREENSHOT_DIR = './screenshots';
const DIFFERENCE_DIR = './difference';

// Inits
const nightmare = Nightmare({
  show: false
});

const niffy = new Niffy(URL, URL, {
  show: true 
});

// Helpers
let getCurrentTimestamp = () => {
  let date = new Date();
  return date.getTime();
}

let getCurrScreenshot = () => {
  let files = fs.readdirSync(SCREENSHOT_DIR);
  return files.length > 0 ? './' + SCREENSHOT_DIR + '/' + files.reverse()[1] : '';
}

let getPrevScreenshot = () => {
  let files = fs.readdirSync(SCREENSHOT_DIR);
  return files.length > 0 ? './' + SCREENSHOT_DIR + '/' + files.reverse()[0] : '';
}

let getLastDifference = () => {
  let files = fs.readdirSync(DIFFERENCE_DIR);
  return files.length > 0 ? './' + DIFFERENCE_DIR + '/' + files.reverse()[0] : '';
}

let getNumberOfDiffPixels = (file1, file2) => {
  return new Promise((resolve, reject) => {
    let img1 = fs.createReadStream(file1).pipe(new PNG()).on('parsed', doneReading);
    let img2 = fs.createReadStream(file2).pipe(new PNG()).on('parsed', doneReading);
  
    let filesRead = 0;
  
    function doneReading() {
      if (++filesRead < 2) return;

      const diff = new PNG({width: img1.width, height: img2.height});
      diff.pack().pipe(fs.createWriteStream(DIFFERENCE_DIR + '/' + getCurrentTimestamp() + '.png'));

      const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        img1.width,
        img1.height,
        {
          threshold: 0.1
        }
      );

      resolve(numDiffPixels);
    }
  });
}

// Go
nightmare
  .goto(URL)
  .screenshot(SCREENSHOT_DIR + '/' + getCurrentTimestamp() + '.png')
  .end()
  .then(_ => {
    return getNumberOfDiffPixels(getPrevScreenshot(), getCurrScreenshot());
  })
  .then(numDiffPixels => {

    // Do some diffing compare to error if pixels is greater than 0
    expect(numDiffPixels).to.equal(0);

    // Pack the image and send
    let imagePath = getLastDifference();
    let filename = imagePath.split('/').reverse()[0];
    let subject = 'Test Failed - ' + filename;
    let path = imagePath;
    send({
      from: 'ntuanb@gmail.com',
      to: 'ntuanb@gmail.com',
      subject: subject,
      text: '',
      html: '<img src="cid:image" />',
      attachments: [{
        filename: filename,
        path: path,
        cid: 'image'
      }]
    });

  })
  .catch(error => {
    console.log('Error occurred', error);
  });