// Libs
const Nightmare         = require('nightmare')
const fs                = require('fs')
const PNG               = require('pngjs').PNG
const pixelmatch        = require('pixelmatch')
const { expect }        = require('chai');
const { send }          = require('./email.js');

let getCurrentTimestamp = () => {
  let date = new Date();
  return date.getTime();
}

let createDirectory = (name) => {
  if (!fs.existsSync('./' + name)){
    fs.mkdirSync('./' + name);
  }
}

// Constants
const URL = 'http://localhost:8090';
const BUILD_DIRECTORY = './builds';
const TEST_NAME = 'homepage';

let timestamp = getCurrentTimestamp();
let directory = BUILD_DIRECTORY + '/' + timestamp;
createDirectory(directory);

let filename = TEST_NAME;
let fullpath = directory + '/' + filename + '.png';

// Inits
const nightmare = Nightmare({
  show: false
});

// Helpers
let getNumberOfDiffPixels = (file1, file2) => {
  return new Promise((resolve, reject) => {
    let img1 = fs.createReadStream(file1).pipe(new PNG()).on('parsed', doneReading);
    let img2 = fs.createReadStream(file2).pipe(new PNG()).on('parsed', doneReading);
  
    let filesRead = 0;
  
    function doneReading() {
      if (++filesRead < 2) return;

      const diff = new PNG({width: img1.width, height: img2.height});
      diff.pack().pipe(fs.createWriteStream(directory + '/' + filename + '-diff.png'));

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

let getPrevBuildsFolder = () => {
  let files = fs.readdirSync(BUILD_DIRECTORY);
  return files.reverse()[1];
}

let getPrevBuildsFile = (filename) => {
  return BUILD_DIRECTORY + '/' + getPrevBuildsFolder() + '/' + filename + '.png';
}

// Go
console.log('Nightmaring...');
nightmare
  .goto(URL)
  .screenshot(fullpath)
  .end()
  .then(_ => {
    console.log('Screenshot done...')
    return getNumberOfDiffPixels(getPrevBuildsFile(filename), fullpath);
  })
  .then(numDiffPixels => {
    console.log('Difference in pixels:', numDiffPixels);

    // Download the S3 build previously as a zip
    // Unpack
    // Do a compare

    // Pack the image and send OR upload to amazon S3
    console.log('Sending email...');
    let imagePath = directory + '/' + filename + '-diff.png';
    let subject = 'Test Failed - ' + TEST_NAME;
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

    // Do some diffing compare to error if pixels is greater than 0
    expect(numDiffPixels).to.equal(0);

  })
  .catch(error => {
    console.log('Error occurred', error);
  });