import csv_parser from 'csv-parser'
import fs from 'fs'
import stripBomStream from 'strip-bom-stream'
import glob from 'glob'
import path from 'path'
import filter from './src/handler/filter_handler'
import extraction from './src/handler/extraction_handler'
import report from './src/handler/report_handler'
import csvWriterInstances from './src/util/csvWriters'



const LOAD_DIVISIONS = () => {
    const divisions = []
    glob.sync( './schema/report/workbook/**/*.json' ).forEach(( file ) => { 
        const division = require(path.resolve( file ))
        divisions.push(division)
    })
    return divisions
}


class DIVISION_EXTRACTION  {
    constructor(extractionconf){
        this.extractionconf = extractionconf
        this.destPath = `${extractionconf.output.dir}/${extractionconf.output.filename}.csv`
        
    }

    execute() {
        const extractionconf = this.extractionconf
        let row_number = 1

        const HANDLE = (extractionconf) => {
            return (data) => {
                ++row_number
                if(filter(extractionconf.filters)(data)) {
                    data["src_row_no"] = row_number
                    const writer = csvWriterInstances.build(this.destPath, Object.keys(data).map((key)=>{return {id: key, title: key}}))
                    writer.writeRecords(data)
                }
            }
        }

        return new Promise((resolve, reject) => {
            const srcPath = `${extractionconf.input.dir}/${extractionconf.input.filename}`
            const destPath = this.destPath

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
            .on('end', () => {
                console.log(`Write filtered data to ${destPath}`)
                csvWriterInstances.get(destPath)
                    .finalize(()=>{
                        console.log(`CSV written to path ${destPath}`)
                        extraction(destPath, extractionconf).then((consolidatedExtractedWorkbook)=>{
                            report(consolidatedExtractedWorkbook, `${extractionconf.output.dir}/${extractionconf.output.filename}.xls`).then(()=>{
                                console.log("Done write of log")
                                resolve(Promise.resolve())
                            })
                        })
                    })   
            });
        })
    }

}

const MAIN = () => {
    const divisions = LOAD_DIVISIONS()
    let actionPromise = Promise.resolve()
    for(const i in divisions) {
        const extractionconf = divisions[i]
        actionPromise = actionPromise.then(new DIVISION_EXTRACTION(divisions[i]).execute())
    }
}

MAIN()