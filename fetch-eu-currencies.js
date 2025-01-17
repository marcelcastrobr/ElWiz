#!/usr/bin/env node

"use strict"

const fs = require('fs');
const yaml = require("yamljs");
const convert = require('xml-js');
const request = require('axios');

const config = yaml.load("config.yaml");

const savePath = config.currencyDirectory;
const debug = config.DEBUG;

const namePrefix = 'currencies-';
const url = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

let options = {
  headers: {
    'accept': 'application/xml',
    'Content-Type': 'text/xml',
  },
  method: 'GET'
}

function getEuroRates(cur) {
  let obj = {}
  for (let i = 0; i < cur.length; i++) {
    obj[cur[i]._attributes.currency] = cur[i]._attributes.rate * 1
  }
  return obj
}
async function getCurrencies() {
  request(url, options)
    .then(function (body) {
      let result = convert.xml2js(body.data, { compact: true, spaces: 4 });
      let root = result['gesmes:Envelope']['Cube']['Cube']
      let obj = {
        "status": "OK",
        "date": root._attributes.time,
        "base": "EUR",
        "rates": getEuroRates( root.Cube)
      }

      let fileName = savePath + '/' + namePrefix + obj['date'] + '.json';
      fs.writeFileSync(fileName, JSON.stringify(obj, false, 2));
      fileName = savePath + '/' + namePrefix + 'latest.json';
      fs.writeFileSync(fileName, JSON.stringify(obj, false, 2));
      if (debug) {
        console.log(JSON.stringify(obj, !debug, 2))
      }
    })
    .catch(function (err) {
      if (err.response) {
        console.log('Error:', err.response.status, err.response.statusText);
        console.log('Headers:', err.response.headers)
      }
    })
}

function init() {
  if (!fs.existsSync(savePath)) {
    fs.mkdirSync(savePath, { recursive: true });
  }
}

init();
getCurrencies();

