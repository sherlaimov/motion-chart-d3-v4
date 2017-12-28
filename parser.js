const fs = require('fs');
// const nodeXlsx = require('node-xlsx');
const xlsx = require('xlsx');

const writeStream = fs.createWriteStream('crude_2016.json');

const requiredFields = ['Дата', 'Производитель', 'Вес, кг', 'Цена в валюте контракта - 1т'];

// ********** Original XLSX **************
const workbook = xlsx.readFile(`${__dirname}/Crude Oil Export 2016 коррект.xls`);
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const jsonWorksheet = xlsx.utils.sheet_to_json(worksheet);
// console.log();

const neededFields = jsonWorksheet.map(row => {
  const newObj = {};
  requiredFields.forEach(fieldName => (newObj[fieldName] = row[fieldName]));
  return newObj;
});
const producerNames = new Set();
neededFields.forEach(field => producerNames.add(field['Производитель']));

const output = [];
producerNames.forEach(name => {
  const producerObj = {
    producer: '',
    weight: [],
    avgDelivery: [],
    accumulatedDelivery: [],
    price: []
  };
  const filtered = neededFields.filter(field => field['Производитель'] === name);
  producerObj.producer = filtered[0]['Производитель'];
  filtered.forEach((field, i, arr) => {
    const weight = Number(field['Вес, кг'].replace(/\,/g, ''));
    const price = Number(field['Цена в валюте контракта - 1т']);
    producerObj.weight.push([field['Дата'], weight]);
    producerObj.price.push([field['Дата'], price]);
  });

  producerObj.weight.forEach((value, i, arr) => {
    const date = value[0];
    const sumPrev = arr.reduce((a, b, index) => {
      if (index <= i) {
        return a + b[1];
      }
      return a;
    }, 0);
    const avgDelivery = sumPrev / (i + 1);
    producerObj.avgDelivery.push([date, avgDelivery]);
    producerObj.accumulatedDelivery.push([date, sumPrev]);
  });

  output.push(producerObj);
});

writeStream.write(JSON.stringify(output));

console.log(JSON.stringify(output, null, 2));
