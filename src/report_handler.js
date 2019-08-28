
import csv_parser from 'csv-parser'
import fs from 'fs'
import stripBomStream from 'strip-bom-stream'
import filter from './filter_handler'
import arithmetic from './util/arithmetic'

const extractionUtil = {
    "addKeys": (row, extract, keys) => {
        let target = extract
        for(let i in keys) {
            if(target[row[keys[i]]] === undefined) {
                target[row[keys[i]]] = {}
            }
            target = target[row[keys[i]]]
        }
    },
    "populate": (row, extract, populations) => {
        if(extract["variables"] === undefined) extract["variables"] = {}
        const variables = extract.variables
        console.log(variables)
        for(let i in populations) {
            const target = populations[i]
            
            if(variables[target.variable] === undefined) variables[target.variable] = target.variable_initial_value
            if(filter(target.filters)){
                const fn = arithmetic(target.computation.operator)
                variables[target.variable] = fn(variables[target.variable], variables[target.variable].operand)
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
            extractionUtil.addKeys(data, object, schema.composite_keys)
            extractionUtil.populate(data, object, schema.populations)
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