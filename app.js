import csv_parser from 'csv-parser'
import fs from 'fs'
import stripBomStream from 'strip-bom-stream'
import filter from './src/filter'
import csvWriterInstances from './src/csvWriters'
import extractionconf from './config/extraction.json'


const HANDLE = (data) => {
    
    if(filter(extractionconf.filters)(data)) {
        console.log("Row data extracted...")
        const path = `${extractionconf.output.dir}/${extractionconf.output.filename}`
        const writer = csvWriterInstances.build(path, Object.keys(data).map((key)=>{return {id: key, title: key}}))
        writer.writeRecords(data)
    }
}


const MAIN = () => {
    console.log("SRC file:", extractionconf.input.dir + '/' + extractionconf.input.filename)
    fs.createReadStream(extractionconf.input.dir + '/' + extractionconf.input.filename)
    .pipe(stripBomStream())
    .pipe(csv_parser())
    .on('data', HANDLE)
    .on('end', () => {
    });
}

MAIN()