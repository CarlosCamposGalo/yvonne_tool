import csv_parser from 'csv-parser'
import fs from 'fs'
import stripBomStream from 'strip-bom-stream'
import glob from 'glob'
import path from 'path'
import filter from './src/filter_handler'
import extraction from './src/extraction_handler'
import csvWriterInstances from './src/csvWriters'

import schema from  './config/report/division.json'


const LOAD_DIVISIONS = () => {
    const divisions = []
    glob.sync( './config/filters/divisions/**/*.json' ).forEach(( file ) => { 
        const division = require(path.resolve( file ))
        divisions.push(division)
    })
    return divisions
}

const HANDLE = (extractionconf) => {
    return (data) => {
        if(filter(extractionconf.filters)(data)) {
            const path = `${extractionconf.output.dir}/${extractionconf.output.filename}`
            const writer = csvWriterInstances.build(path, Object.keys(data).map((key)=>{return {id: key, title: key}}))
            writer.writeRecords(data)
        }
    }
}

const MAIN = () => {
    const divisions = LOAD_DIVISIONS()
    for(const i in divisions) {
        const extractionconf = divisions[i]
        const destPath = `${extractionconf.output.dir}/${extractionconf.output.filename}`
        const srcPath = `${extractionconf.input.dir}/${extractionconf.input.filename}`

        console.log("SRC file:", srcPath)
        console.log("DEST file:", destPath)

        if(fs.existsSync(destPath)) {
            fs.unlinkSync(destPath)
            console.log(`Deleted destination path: ${destPath}`)
        }
    
        fs.createReadStream(srcPath)
        .pipe(stripBomStream())
        .pipe(csv_parser())
        .on('data', HANDLE(extractionconf))
        .on('end', () => 
            csvWriterInstances.get(destPath)
                .finalize(()=>{
                    console.log(`CSV written to path ${destPath}`)
                    extraction(destPath, schema)
                })
        );
    }
}

MAIN()