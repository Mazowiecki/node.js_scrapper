var express = require('express');
var app = express();
const fs = require('fs');
var json2csv = require('json2csv');
const csv = require('fast-csv');
const prompt = require('prompt');
const Nightmare = require('nightmare');

/* Dependency settings to convert json to csv and download csv file */
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: 'out.csv',
    header: [
        {id: 'name', title: 'Name'},
        {id: 'surname', title: 'Surname'},
        {id: 'country', title: 'Country'},
        {id: 'company', title: 'Company'},
        {id: 'position', title: 'Position'},
    ]
});
let dataArray = [];


app.get('/', function (req, res) {

});
app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
    const puppeteer = require("puppeteer-extra");
    const linkedinUrl  = `https://www.linkedin.com/login?trk=guest_homepage-basic_nav-header-signin`;

    const pluginStealth = require("puppeteer-extra-plugin-stealth");
    puppeteer.use(pluginStealth());


    puppeteer.launch({ headless: false }).then(async browser => {

        console.log('Start!');
        const page = await browser.newPage();

        /* Go to the Linkedin page and wait for it to load */
        await page.goto(linkedinUrl, {waitUntil: 'networkidle0'});

        /* Wait for form to load and fill te form */
        await page.waitFor('input[name=session_key]');
        await page.waitFor('input[name=session_password]');

        await page.$eval('input[name=session_key]', el => el.value = 'tyjxdnr93011@10minut.xyz');
        // tyjxdnr93011@10minut.xyz
        await page.$eval('input[name=session_password]', el => el.value = 'Haslo112');

        /* Submit the form */
        page.click('.login__form_action_container > button', {waitUntil: 'networkidle0'});
        await page.waitForNavigation();

        /* If captcha happend turn it on to have time to done captcha */
        // await page.waitFor(8000);

        /* After login redirect to destination url */
        await page.goto('https://www.linkedin.com/mynetwork/invitation-manager/sent/', {waitUntil: 'networkidle2'});


        /* Get data function */
        async function getData() {
            /* Wait for page to load */
            await page.waitFor(() => document.querySelector('.mn-invitation-list'));
            /* Get links from list page */
            let getLinks = await page.evaluate( async() => {
                /* Get all persons links */
                let links = document.querySelectorAll('.invitation-card__details > a');
                let urlsArray = [];
                /* Iterate throught the links to push url's them to array */
                for (let i = 0; i < links.length; i++) {
                    urlsArray.push({
                        name: links[i].href
                    })
                }
                return urlsArray;
            });
            /* Save old list page url to turn it on when all links will be done and to direct to next page from pagination */
            let currentListPage = page.url();
            /* Iterate thought urls to open pages */
            try {
                for (let j=0; j<getLinks.length; j++) {
                    /* Open page from iterated url */
                    await page.goto(getLinks[j].name);
                    /* Wait for data div to load */
                    await page.waitFor(() => document.querySelector('.mr5'));
                    /* Get the data and create object */
                    let data2 = await page.evaluate( async() => {
                    /* Define variables to store data */
                        let name = '';
                        let surname = '';
                        let country = '';
                        let company = '';
                        let position = '';

                        /* First 'if' is for normal account 'else if' is for premium account. Classes between this accounts are different. Last 'else' is if there is no element on the page */
                        if (document.querySelector('.pv-top-card-section__name') != null) {
                            let names = document.querySelector('.pv-top-card-section__name').innerText.split(" ");
                            name = names[0];
                            console.log(name);
                            surname = names[1];
                            console.log(surname);
                        } else if (document.querySelector('.ph5 .t-24') != null) {
                            let names = document.querySelector('.ph5 .t-24').innerText.split(" ");
                            name = names[0];
                            console.log(name);
                            surname = names[1];
                            console.log(surname);
                        } else {
                            name = '';
                            surname = '';
                        }

                        if (document.querySelector('.pv-top-card-section__location') != null) {
                            let locations = document.querySelector('.pv-top-card-section__location').innerText.split(",");
                            country = locations[0];
                            console.log(country);
                        } else if (document.querySelector('.ph5 .mt1 .t-16') != null) {
                            let locations = document.querySelector('.ph5 .mt1 .t-16').innerText.split(",");
                            country = locations[0];
                            console.log(country);
                        }  else {
                            country = '';
                        }

                        if (document.querySelector('.pv-top-card-v2-section__company-name') != null) {
                            company = document.querySelector('.pv-top-card-v2-section__company-name').innerText;
                            console.log(company);
                        } else if (document.querySelector('.ph5 .pv-top-card-v3--experience-list .t-14') != null) {
                            company = document.querySelector('.ph5 .pv-top-card-v3--experience-list .t-14').innerText;
                            console.log(company);
                        }  else {
                            company = '';
                        }

                        if (document.querySelector('.pv-top-card-section__headline') != null) {
                            position = document.querySelector('.pv-top-card-section__headline').innerText;
                            console.log(position);
                        } else if (document.querySelector('.ph5 .mr5 h2') != null) {
                            position = document.querySelector('.ph5 .mr5 h2').innerText;
                            console.log(position);
                        }  else {
                            position = '';
                        }
                        /* Return data from page as object */
                        return {
                            name,
                            surname,
                            country,
                            company,
                            position
                        }
                    });
                    /* Push this object to data array */
                    dataArray.push(data2);
                }
                /* Back to old list page */
                await page.goto(currentListPage);
                /* Wait for page to load */
                await page.waitFor(() => document.querySelector('.ember-view'));
                /* If there is navigation... */
                if (await page.$('.mn-invitation-pagination') !== null) {
                    /* Check if button 'next page' dont have 'disabled' class. If do, it is last page of pagination */
                    let data3 = await page.evaluate( async() => {
                        let nextButton = document.querySelectorAll('.mn-invitation-pagination .artdeco-button')[1];
                        return nextButton.classList.contains('disabled');
                    });
                    /* If it isnt last page... */
                    if (!data3) {
                        /* Get url of next page */
                        let nextButton= await page.evaluate(() => {
                            let helper = document.querySelectorAll('.mn-invitation-pagination .artdeco-button');
                            return helper[1].href;
                        });
                        /* Go to next list page */
                        await page.goto(nextButton, {waitUntil: 'networkidle2'});
                        /* Wait for data div to load */
                        await page.waitFor(() => document.querySelector('.mn-invitation-list'));
                        /* Recall all getData function */
                        getData();
                    } else {
                        /* Use dependency to convert json to csv and save file */
                        csvWriter
                            .writeRecords(dataArray)
                            .then(()=> console.log('The CSV file was written successfully'));
                    }
                } else {
                    /* Use dependency to convert json to csv and save file */
                    csvWriter
                        .writeRecords(dataArray)
                        .then(()=> console.log('The CSV file was written successfully'));
                }
            } catch(e) {
                console.log(e);
            }


        }

        /* Call function getData */
        getData();

        /* Close browser */
        // await browser.close();
    });
});