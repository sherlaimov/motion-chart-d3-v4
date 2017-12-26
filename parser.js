const fs = require('fs');
const nodeXlsx = require('node-xlsx');
const xlsx = require('xlsx');
// const writeStream = fs.createWriteStream('secret.xls');

const requiredFields = [
  'Дата',
  'Покупатель',
  'Производитель',
  'Вес, кг',
  'Цена в валюте контракта - 1т',
];

const dataScheme = {
  producer: 'Dow Chemical',
  consumer: 'Lava',
  weight: [['data', 'Вес, кг']],
  price: [['data', 'Цена в валюте контракта - 1т']],
};

// const workSheetsFromFile = xlsx.parse(${__dirname}/Crude Oil Export 2016 коррект.xls);
// const headers = workSheetsFromFile[0].data.shift();
// const firstLine = workSheetsFromFile[0].data[0];
// console.log(headers);
// console.log(firstLine);
// console.log(workSheetsFromFile[0]);

// const testData = [
//   [1, 2, 3],
//   [true, false, null, 'sheetjs'],
//   ['foo', 'bar', new Date('2014-02-19T14:30Z'), '0.3'],
//   ['baz', null, 'qux'],
// ];
// const buffer = nodeXlsx.build([{ name: 'mySheetName', data: data }]); // Returns a buffer

// writeStream.write(buffer);

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
  const producerObj = neededFields
    .filter(field => field['Производитель'] === name)
    .map((field, i, arr) => {
      return {
        producer: field['Производитель'],
        consumer: field['Покупатель'],
        weight: arr.map(field => [field['Дата'], field['Вес, кг']]),
        price: arr.map(field => [field['Дата'], field['Цена в валюте контракта - 1т']]),
      };
    });
  output.push(...producerObj);
});

console.log(output);
