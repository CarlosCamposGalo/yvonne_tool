import csv_parser from 'csv-parser'
import fs from 'fs'
import stripBomStream from 'strip-bom-stream'
import filter from './src/filter'
import conf from './config/extraction.json'

const MAIN = () => {
fs.createReadStream('/media/carldrive/Downloads/MRP_COMPLETED_ORDERS_EXPORT.csv')
    .pipe(stripBomStream())
    .pipe(csv_parser())
    .on('data', (data) => {if(filter(conf.filters)(data)) console.log(data)})
    .on('end', () => {
    // [
    //   { NAME: 'Daffy Duck', AGE: '24' },
    //   { NAME: 'Bugs Bunny', AGE: '22' }
    // ]
    });
}

MAIN()