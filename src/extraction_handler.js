
import csv_parser from 'csv-parser'
import fs from 'fs'
import stripBomStream from 'strip-bom-stream'
import filter from './filter_handler'
import {CastFactory} from './util/datatype'
import arithmetic from './util/arithmetic'

class ExtractionUtil {
    addKeys(row, extract, keys) {
        let target = extract
        for(let i in keys) {
            if(row[keys[i]] && target[row[keys[i]]] === undefined) {
                target[row[keys[i]]] = {}
            }

           target = target[row[keys[i]]]
        }
    }
    populate(data, extract, populations){
        if(extract["variables"] === undefined) extract["variables"] = {}
        const variables = extract.variables
        for(let i in populations) {
            const target = populations[i]
            if(variables[target.variable_name] === undefined) variables[target.variable_name] = target.variable_initial_value
            if(filter(target.filters)(data)){
                const fn = arithmetic(target.computation.operator)
                const operand_value = this.getValue(target.computation.operand, variables, data)
                const castFn = CastFactory(target.variable_data_type)
                variables[target.variable_name] = fn(castFn(variables[target.variable_name]), castFn(operand_value))
            }
        }
    }
    getValue(value, variables, data) {
        if(typeof value === "string" && value.startsWith("<") && value.endsWith(">")) {
            const identity = value.substring(1, value.length-1)
            return variables[identity]
        } else if(typeof value === "string" && value.startsWith("[") && value.endsWith("]")){
            const identity = value.substring(1, value.length-1)
            return data[identity]
        } 
        return value
    }
    extract(srcPath, page) {
        return new Promise((resolve, reject)=> {
            let row_number = 1
            const extractedData = {}

            /**
             * HANDLE the csv data to be interpreted with the following format below. 
             * This format is necessary to transform data as expected.
             * {
             *      "a_supplier_name": {
             *          "variables": {
             *            totalInspsPerSupplier: 0
             *          },
             *          "sub_row": {
             *              "a_factory_name": {
             *                 "variables": {
             *                  }
             *              }
             *          }
             *       }
             * }
             */
            const HANDLE = (object) => {
                return (data) => {
                    ++row_number
                    if(filter(page.worksheet.filters)(data)) {
                        const table = page.table
                        console.log(`Source file: ${srcPath};Belongs to worksheet "${page.worksheet.worksheet_name}";POPULATE ROW ` + row_number, table.primary_key + ": " + data[table.primary_key], table.sub_row.primary_key + ": " + data[table.sub_row.primary_key])
                        this.addKeys(data, object, [table.primary_key])
                        this.populate(data, object[data[table.primary_key]], table.populations)
                        this.addKeys({"sub_row": "sub_row"},  object[data[table.primary_key]], ["sub_row"])
                        this.addKeys(data,  object[data[table.primary_key]]["sub_row"], [table.sub_row.primary_key])
                        this.populate(data, object[data[table.primary_key]]["sub_row"][data[table.sub_row.primary_key]], table.sub_row.populations)
                    }
                }
            }

            fs.createReadStream(srcPath)
            .pipe(stripBomStream())
            .pipe(csv_parser())
            .on('data', HANDLE(extractedData))
            .on('end', () => {
                console.log(`${srcPath}: EXTRACTION COMPLETE ******************************************* `)
                console.log(JSON.stringify(extractedData))
                resolve(extractedData)
            });  
        })
    }

}


class WorkbookUtil {
    build(schema) {
        const resultObj = {"worksheets":[]}
        for(let i in schema.worksheets) {
            const worksheetSchema = schema.worksheets[i].worksheet_path
            const tableSchema = schema.worksheets[i].table_path
            const worksheet = {
                "worksheet": require(worksheetSchema),
                "table": require(tableSchema)
            }
            resultObj.worksheets.push(worksheet)
        }
        return resultObj
    }
}


export default (srcPath, workbook)=>{
    const workbookUtil = new WorkbookUtil()
    const workbookBluePrint = workbookUtil.build(workbook)
    const extractionUtil = new ExtractionUtil()
    for(let i in workbookBluePrint.worksheets) {
        extractionUtil.extract(srcPath, workbookBluePrint.worksheets[i])
    }
}