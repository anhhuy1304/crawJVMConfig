const puppeteer = require('puppeteer');
const http = require('http');
const cheerio = require('cheerio');
const { PerformanceObserver, performance } = require('perf_hooks');
let regexXMX = /(Xmx)[0-9]*./;
let regexXMS = /(Xms)[0-9]*./;
let regexXMN = /(Xmn)[0-9]*./;
let regexProjectName = /^(\w+-?)*/;

(async () => {
    let server = [
        "10.30.22.106",
        "10.30.22.107",
        "10.30.22.108",
        "10.30.22.109",
        "10.30.22.111",
        "10.30.22.112",
        "10.30.22.113",
        "10.30.22.114",
        "10.30.22.115",
        "10.30.22.116",
        "10.30.22.118",
        "10.30.22.119",
        "10.30.22.123",
        "10.30.22.124",
        "10.30.22.125",
        "10.30.22.126",
        "10.30.22.128",
        "10.30.22.129",
        "10.30.22.130",
        "10.30.22.133",
        "10.30.22.134",
        "10.30.22.135",
        "10.30.22.14",
        "10.30.22.140",
        "10.30.22.142",
        "10.30.22.143",
        "10.30.22.144",
        "10.30.22.145",
        "10.30.22.15",
        "10.30.22.152",
        "10.30.22.153",
        "10.30.22.154",
        "10.30.22.157",
        "10.30.22.158",
        "10.30.22.161",
        "10.30.22.162",
        "10.30.22.163",
        "10.30.22.165",
        "10.30.22.166",
        "10.30.22.167",
        "10.30.22.17",
        "10.30.22.173",
        "10.30.22.174",
        "10.30.22.175",
        "10.30.22.176",
        "10.30.22.177",
        "10.30.22.18",
        "10.30.22.183",
        "10.30.22.184",
        "10.30.22.185",
        "10.30.22.186",
        "10.30.22.187",
        "10.30.22.188",
        "10.30.22.19",
        "10.30.22.195",
        "10.30.22.196",
        "10.30.22.197",
        "10.30.22.198",
        "10.30.22.20",
        "10.30.22.201",
        "10.30.22.202",
        "10.30.22.203",
        "10.30.22.204",
        "10.30.22.206",
        "10.30.22.207",
        "10.30.22.208",
        "10.30.22.210",
        "10.30.22.22",
        "10.30.22.229",
        "10.30.22.23",
        "10.30.22.230",
        "10.30.22.231",
        "10.30.22.232",
        "10.30.22.237",
        "10.30.22.238",
        "10.30.22.239",
        "10.30.22.24",
        "10.30.22.240",
        "10.30.22.242",
        "10.30.22.243",
        "10.30.22.244",
        "10.30.22.247",
        "10.30.22.248",
        "10.30.22.250",
        "10.30.22.251",
        "10.30.22.252",
        "10.30.22.253",
        "10.30.22.26",
        "10.30.22.27",
        "10.30.22.28",
        "10.30.22.29",
        "10.30.22.31",
        "10.30.22.32",
        "10.30.22.33",
        "10.30.22.35",
        "10.30.22.37",
        "10.30.22.4",
        "10.30.22.40",
        "10.30.22.41",
        "10.30.22.45",
        "10.30.22.48",
        "10.30.22.5",
        "10.30.22.50",
        "10.30.22.56",
        "10.30.22.57",
        "10.30.22.60",
        "10.30.22.61",
        "10.30.22.62",
        "10.30.22.63",
        "10.30.22.64",
        "10.30.22.65",
        "10.30.22.66",
        "10.30.22.67",
        "10.30.22.68",
        "10.30.22.69",
        "10.30.22.70",
        "10.30.22.71",
        "10.30.22.72",
        "10.30.22.73",
        "10.30.22.76",
        "10.30.22.78",
        "10.30.22.79",
        "10.30.22.8",
        "10.30.22.80",
        "10.30.22.82",
        "10.30.22.83",
        "10.30.22.87",
        "10.30.22.89",
        "10.30.22.9",
        "10.30.22.93",
        "10.30.22.94",
        "10.30.22.95",
        "10.30.22.98",
        "10.30.22.99"];
    for (const index in server) {
        if (server.hasOwnProperty(index)) {
            await crawlProjectFromServer(server[index])
                .then(listProject => detectProjectWrongConfig(server[index], listProject))
                .catch(error => {
                    console.error("Server not has profiler: ", server[index])
                })
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
                    if (xmnValue * 1.2 >= xmxValue) {
                        console.log(server, project.replace('Index', ''), xmx, xms, xmn)
                    }
                }
            }).catch(error => {
                if (error.code != 'ECONNREFUSED' && error.code != 'ECONNRESET') {
                    console.error(server, urlInfoProject[i], error)
                }
            })
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