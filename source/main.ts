import * as agent from "superagent";
import * as twit from "twit";
import { TwitterScraper } from "./twitter.scraper";
import { WebScraper } from "./web.scraper";

var fs = require('fs');
var sanitize = require('sanitize-filename');

const parameters = process.argv.slice(2);
if (parameters.length !== 3)
  throw new Error("Expects 3 parameters: 'handlefile', 'customer key' and 'customer secret'");

const twitterHandlesPath = parameters[0];
const customerKey = parameters[1];
const customerSecret = parameters[2];

var dataDir = "data";
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

var lineReader = require('readline').createInterface({
  input: fs.createReadStream(twitterHandlesPath)
});

const twitter = new twit({
  consumer_key: customerKey,
  consumer_secret: customerSecret,
  app_only_auth: true
})

const twitterScraper = new TwitterScraper(twitter);
var dateString = new Date().toLocaleDateString();
var startId = 3008817393232203899;

lineReader.on('line', (line: string) => {
  var screenName = line;
  console.log(`Loading twitter data for: ${screenName}`);
  var dir = `${dataDir}/${screenName}_${dateString}`;
  fs.mkdirSync(dir);
  var websiteDir = `${dir}/websites`;
  fs.mkdirSync(websiteDir);
  var imagesDir = `${dir}/images`;
  fs.mkdirSync(imagesDir);

  twitterScraper.getTweets(screenName, startId).then(tweets => {
    fs.writeFile(`${dir}/${tweets.length}_tweets.json`, JSON.stringify(tweets), (error: Error) => {
      if (error)
        return console.log("Error saving tweets:", error);
      
      console.log(`${screenName} - ${tweets.length} tweets saved!`);
      tweets.forEach(tweet => storeWebsiteData(websiteDir, imagesDir, tweet));
    });
  }).catch(error => {
    console.log(`Error loading tweets for ${screenName}:`, error);
  });
});

const webScraper = new WebScraper();
function storeWebsiteData(dir: string, imageDir: string, tweet: any) {
  var urls: [any] = tweet.entities.urls;
  urls.forEach(url => {
    const fullUrl = url.expanded_url;
    const website = webScraper.getWebsite(fullUrl).then(website => {
      var filename = sanitize(`${tweet.id}_${url.display_url}`)
      saveWebsite(url.expanded_url, dir, filename, website.html);

      website.images.forEach(src => {
        agent.get(src).buffer(true).then(response => {
          var imageFilename = sanitize(`${tweet.id}_${src}`);
          saveImage(src, imageDir, imageFilename, response.body);
        }).catch(error => console.log(`Error loading image ${src}`, error.message));
      });
      
    }).catch(error => console.log(`Error storing website data: ${url.expanded_url}: ${error}`));;
  });
}

function saveWebsite(url: string, dir: string, filename: string, html: string) {
  fs.writeFile(`${dir}/${filename}.html`, html, (error: Error) => {
    if (error) return console.log("Error saving website:", error.message);
    console.log(`${url} - website saved!`);
  });
}

function saveImage(url: string, dir: string, filename: string, image: Buffer) {
  fs.writeFile(`${dir}/${filename}.png`, image, (error: Error) => {
    if (error) return console.log("Error saving image:", error.message);
    console.log(`${url} - image saved!`);
  });
}
