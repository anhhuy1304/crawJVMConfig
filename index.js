const puppeteer = require('puppeteer');
const { PerformanceObserver, performance } = require('perf_hooks');
let regexXMX = /(Xmx)[0-9]*./;
let regexXMS = /(Xms)[0-9]*./;
let regexXMN = /(Xmn)[0-9]*./;
let regexProjectName = /^.*/;

(() => {
  let server = [ '10.30.80.16'];
  server.forEach(s => {
    crawlConfigJVM(s);
  })
})();

async function crawlConfigJVM(server) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 720 });
  try {
    await page.goto('http://' + server + ":65000/sc", { waitUntil: 'networkidle2' });
  } catch (err) {
  }
  const project = await page.evaluate(() => {
    let dataPage = document.querySelectorAll('tbody iframe');
    dataPage = [...dataPage];
    let project = [];
    dataPage.forEach(data => {
      project.push(data.getAttribute('src'))
    })
    return project;
  });
  page.close();
  let urlInfoProject = []
  // urlInfoProject.push('http://10.30.80.16:65081/fi')
  project.forEach(item => {
    urlInfoProject.push(item.replace(/\/{1}bi.*/g, '/fi'));
  })


  console.log("start crawl server: " + server+ " ("+urlInfoProject.length+" project)")
  for (i in urlInfoProject) {
    // var t0 = performance.now();
    let pageDetail = await browser.newPage();
    try {
      await pageDetail.goto(urlInfoProject[i], { waitUntil: 'networkidle2' });
    } catch (err) {
    }
    let config = await pageDetail.evaluate(() => {
      let dataPage = document.querySelectorAll('body');
      dataPage = dataPage[0].innerText;
      return dataPage
    });
    let project = regexProjectName.exec(config) ? regexProjectName.exec(config)[0] : "error project Name"
    let xmx = regexXMX.exec(config) ? regexXMX.exec(config)[0] : "xmx:default";
    let xms = regexXMS.exec(config) ? regexXMS.exec(config)[0] : "xms:default";
    let xmn = regexXMN.exec(config) ? regexXMN.exec(config)[0] : "xmn:default";
    if(xmx != 'xmx:default' && xmn != 'xmn:default'){
      let xmxFormatNumber = /[0-9]+/.exec(xmx)[0];
      let xmxType = /.$/.exec(xmx)[0];
      let xmxValue = xmxType == 'G'? xmxFormatNumber * 1024: xmxFormatNumber;
      let xmnFormatNumber = /[0-9]+/.exec(xmn)[0];
      let xmnType = /.$/.exec(xmn)[0];
      let xmnValue = xmnType == 'G'? xmnFormatNumber * 1024: xmnFormatNumber;
      if(xmnValue *2 >= xmxValue){
        console.log(server, project, xmx, xms, xmn)
      }
    }
    // var t1 = performance.now();
    // console.log(t1 - t0)
    pageDetail.close();
  }
  console.log("end crawl server: " + server+ " ("+urlInfoProject.length+" project)")

  await browser.close();

}

