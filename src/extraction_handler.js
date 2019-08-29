
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
            if(filter(target.filters)){
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
}

/**
 * Extract data as instructed by the scehma config from a csv file.
 * 
 * @param {*} path 
 * @param {*} schema 
 */
const extractData = (srcPath, schema) => {
    return new Promise((resolve, reject)=> {
      let row_number = 1
        const extractedData = {}
        const extractionUtil = new ExtractionUtil()

        /**
         * {
         *      "a_supplier_name": {
         *          "variables": {
         *            totalInspsPerSupplier: 0
         *          },
         *          "sub_row": {
         *          }
         *       }
         * }
         */
        const HANDLE = (object) => {
            return (data) => {
                console.log(`${srcPath}: POPULATE ROW ` + (++row_number), schema.primary_key + ": " + data[schema.primary_key], schema.sub_row.primary_key + ": " + data[schema.sub_row.primary_key])
                extractionUtil.addKeys(data, object, [schema.primary_key])
                extractionUtil.populate(data, object[data[schema.primary_key]], schema.populations)
                extractionUtil.addKeys({"sub_row": "sub_row"},  object[data[schema.primary_key]], ["sub_row"])
                extractionUtil.addKeys(data,  object[data[schema.primary_key]]["sub_row"], [schema.sub_row.primary_key])
                extractionUtil.populate(data, object[data[schema.primary_key]]["sub_row"][data[schema.sub_row.primary_key]], schema.sub_row.populations)
            }
        }

        fs.createReadStream(srcPath)
        .pipe(stripBomStream())
        .pipe(csv_parser())
        .on('data', HANDLE(extractedData))
        .on('end', () => {
            console.log(`${srcPath}: EXTRACTION COMPLETE ******************************************* `)
            resolve(extractedData)
        });  
    })
}

export default extractData