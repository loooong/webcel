import {describe, it} from "mocha";

let assert = require('assert');
const puppeteer = require('D:\\js_dev\\incubator-echarts\\node_modules\\puppeteer');

describe('爬虫', () => {
    it(' 1 ', async function (done) {
        // this.timeout(500);
        // setTimeout(done, 300);
        await runAction();
    });
});

async function runAction() {
    const browser = await puppeteer.launch({headless: false, defaultViewport: {width: 1500, height: 1500}});
    const page = await browser.newPage();
    await page.goto('https://stats.nba.com/player/76375/boxscores/?Season=ALL&SeasonType=Regular%20Season', {
        'timeout': 1000 * 60 * 200
    });
    page.waitFor(1000)
    // await page.on('response', async (response) => {
    //     console.log(response.url)
    //     if (response.url() === "https://stats.nba.com/stats/playergamelog?DateFrom=&DateTo=&LeagueID=00&PlayerID=76375&Season=ALL&SeasonType=Regular+Season"){
    //         console.log('XHR response received');
    //         console.log(await response.json());
    //     }
    // });
    let res
    page.on('response', response => {
        console.log(response.url())
    })

    res = await page.evaluate(() => { // 嵌入代码
        let tableDom = document.getElementsByClassName("nba-stat-table__overflow")[0].getElementsByTagName("component_table.js");
        console.log(tableDom[0]);
        return 1
    });
    console.log(res)
}
