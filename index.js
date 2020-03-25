const puppeteer = require('puppeteer');
const http = require('http');
const cheerio = require('cheerio');
const { PerformanceObserver, performance } = require('perf_hooks');
let regexXMX = /(Xmx)[0-9]*./;
let regexXMS = /(Xms)[0-9]*./;
let regexXMN = /(Xmn)[0-9]*./;
let regexProjectName = /^(\w+-?)*/;

(() => {
  let server = [ '10.30.80.16'];
  for (const index in server) {
    if (server.hasOwnProperty(index)) {
      crawlProjectFromServer(server[index])
    .then(listProject => detectProjectWrongConfig(server[index], listProject))
    .catch(error =>{})
    }
  }
  
})();

async function detectProjectWrongConfig(server, listProject) {
  const $ = cheerio.load(listProject);
  let project = $('tbody iframe').toArray();
  let urlInfoProject = []
  project.forEach(item => {
    urlInfoProject.push(item.attribs.src.replace(/\/{1}bi.*/g, '/fi'));
  })


  console.log("start crawl server: " + server + " (" + urlInfoProject.length + " project)")
  for (i in urlInfoProject) {
    // var t0 = performance.now();
    let data = await crawlProjectDetail(server, urlInfoProject[i])
      .then(dataDetailProject => {
        const detail = cheerio.load(dataDetailProject);
        let config = detail('body').text();
        let project = regexProjectName.exec(config) ? regexProjectName.exec(config)[0] : "error project Name"
        let xmx = regexXMX.exec(config) ? regexXMX.exec(config)[0] : "xmx:default";
        let xms = regexXMS.exec(config) ? regexXMS.exec(config)[0] : "xms:default";
        let xmn = regexXMN.exec(config) ? regexXMN.exec(config)[0] : "xmn:default";
        if (xmx != 'xmx:default' && xmn != 'xmn:default') {
          let xmxFormatNumber = /[0-9]+/.exec(xmx)[0];
          let xmxType = /.$/.exec(xmx)[0];
          let xmxValue = xmxType == 'G' ? xmxFormatNumber * 1024 : xmxFormatNumber;
          let xmnFormatNumber = /[0-9]+/.exec(xmn)[0];
          let xmnType = /.$/.exec(xmn)[0];
          let xmnValue = xmnType == 'G' ? xmnFormatNumber * 1024 : xmnFormatNumber;
          if (xmnValue * 2 >= xmxValue) {
            console.log(server, project.replace('Index',''), xmx, xms, xmn)
          }
        }
      }).catch(error =>{})
    // var t1 = performance.now();
    // console.log(t1 - t0)
  }
  console.log("end crawl server: " + server + " (" + urlInfoProject.length + " project)")
}

function crawlProjectFromServer(server) {
  return new Promise((resolve, reject) => {
    http.get('http://' + server + ':65000/sc', (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
          `Status Code: ${statusCode}`);
      }
      if (error) {
        console.error(error.message);
        res.resume();
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          resolve(rawData);
        } catch (e) {
          reject(e)
        }
      });
    }).on('error', (e) => {
        reject(e)
    });
  })
}



function crawlProjectDetail(server, url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
          `Status Code: ${statusCode}`);
      }
      if (error) {
        console.error(error.message);
        res.resume();
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          resolve(rawData)
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => {
      reject(e);
    });
  })
}