
import csv_parser from 'csv-parser'
import fs from 'fs'
import stripBomStream from 'strip-bom-stream'
import filter from './filter_handler'
import arithmetic from './util/arithmetic'

class ExtractionUtil {
    addKeys(row, extract, keys) {
        let target = extract
        for(let i in keys) {
            if(target[row[keys[i]]] === undefined) {
                target[row[keys[i]]] = {}
            }
            target = target[row[keys[i]]]
        }
    }
    populate(row, extract, populations){
        if(extract["variables"] === undefined) extract["variables"] = {}
        const variables = extract.variables
        for(let i in populations) {
            const target = populations[i]
            if(variables[target.variable_name] === undefined) variables[target.variable_name] = target.variable_initial_value
            if(filter(target.filters)){
                const fn = arithmetic(target.computation.operator)

                variables[target.variable_name] = fn(variables[target.variable_name], target.computation.operand)
            }
        }
    }
}

/**
 * Extract data as instructed by the scehma config from a csv file.
 * 
 * @param {*} path 
 * @param {*} schema 
 */
const extractData = (srcPath, schema) => {

    const extractedData = {}
    const extractionUtil = new ExtractionUtil()

    /**
     * {
     *      "a_supplier_name": {
     *          "variables": {
     *            totalInspsPerSupplier: 0
     *          }
     *       }
     * }
     */

    const HANDLE = (object) => {
        return (data) => {
            extractionUtil.addKeys(data, object, [schema.primary_key])
            extractionUtil.populate(data, object[data[schema.primary_key]], schema.populations)
        }
    }

    fs.createReadStream(srcPath)
    .pipe(stripBomStream())
    .pipe(csv_parser())
    .on('data', HANDLE(extractedData))
    .on('end', () => {
        console.log(extractedData)
    });
}

export default extractData