
import csv_parser from 'csv-parser'
import fs from 'fs'
import stripBomStream from 'strip-bom-stream'
import filter from './filter_handler'
import {CastFactory} from '../operation/datatype'
import arithmetic from '../operation/arithmetic'


const CREATE_UUID = () => {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

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
        if(extract["variables"] === undefined) 
            extract["variables"] = {row_data: data}
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
        /** Get value of the variable from extraction */
        if(typeof value === "string" && value.startsWith("<") && value.endsWith(">")) {
            const identity = value.substring(1, value.length-1)
            return variables[identity]
        }
        /** Get value from the cell */
        else if(typeof value === "string" && value.startsWith("[") && value.endsWith("]")){
            const identity = value.substring(1, value.length-1)
            return data[identity]
        }
        else if(typeof value === "object" && Array.isArray(value) && value.length && value[0].operator) {
            let result = 0
            const compute = (opr) => {
                console.log("Operand ...", result, opr)
                const fn = arithmetic(opr.operator)
                const operand_value = this.getValue(opr.operand, variables, data)
                console.log(operand_value)
                result = fn(result, operand_value)
            }
            for(let i in value){
                compute(value[i])
            }
            return result
        }
        /**Else return the value */
        return value
    }
    extract(srcPath, worksheetBluePrint) {
        return new Promise((resolve, reject)=> {
            console.log(` ${srcPath}: EXTRACTION START for worksheet ${worksheetBluePrint.worksheet_name}********************`)
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
                    if(filter(worksheetBluePrint.filters)(data)) {
                        const table = worksheetBluePrint.table
                        console.log(`Source file: ${srcPath};Belongs to worksheet "${worksheetBluePrint.worksheet_name}";POPULATE ROW ` + row_number, table.primary_key + ": " + data[table.primary_key], table.sub_row.primary_key + ": " + data[table.sub_row.primary_key])
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
                console.log(`${srcPath}: EXTRACTION COMPLETE for worksheet ${worksheetBluePrint.worksheet_name} ******************************************* `)
                resolve(extractedData)
            });
        })
    }
    consolidate(worksheetBluePrint, extractedWorksheet) {
        const consolidated_worksheet = {worksheet_name: worksheetBluePrint.worksheet_name, columns:[], rows:[]}
       
        const generateActualRow = (columnsBluePrint, extractedRow, sub_row_level = 0) => {
            for(let i in columnsBluePrint) {
                const columnBluePrint = columnsBluePrint[i]

                //Check if the column already added
                for(let j in consolidated_worksheet.columns){
                    if(consolidated_worksheet.columns[j].header === columnBluePrint.column_name){
                        columnBluePrint.id = consolidated_worksheet.columns[j].key
                        break
                    }
                }

                if(columnBluePrint.id) continue

                //Inject the id generated to refence with the row
                columnBluePrint.id = CREATE_UUID()
                const column = {
                    header: columnBluePrint.column_name,
                    key: `${columnBluePrint.id}`
                }
                consolidated_worksheet.columns.push(column)
            }

            
            for(let key in extractedRow) {
                if(extractedRow.hasOwnProperty(key)){
                    const row = {}
                    const variables = extractedRow[key].variables ? JSON.parse(JSON.stringify(extractedRow[key].variables)) : {}
                    const sub_row = extractedRow[key].sub_row ? JSON.parse(JSON.stringify(extractedRow[key].sub_row)) : {}
                    delete extractedRow[key].variables
                    delete extractedRow[key].sub_row
    
                    for(let i in columnsBluePrint) {
                        const columnBluePrint = columnsBluePrint[i]
                        row[columnBluePrint.id] = columnBluePrint.column_initial_value
                        console.log(columnBluePrint.column_name)
                        for(let j in columnBluePrint.column_value){
                            let operation = columnBluePrint.column_value[j]
                            const compute = (opr) => {
                                const fn = arithmetic(opr.operator)
                                const operand_value = this.getValue(opr.operand, variables, variables.row_data)
                                const castFn = CastFactory(columnBluePrint.column_data_type)
                                console.log("Operand sa head", row[columnBluePrint.id],  opr.operand, operand_value)
                                row[columnBluePrint.id] = fn(castFn(row[columnBluePrint.id]), castFn(operand_value))
                            }

                            if(typeof operation === "object") {
                                //console.log(variables)
                                compute(operation)
                            }
                        }
                    }
                    consolidated_worksheet.rows.push({row: row, sub_row_level: sub_row_level})
                    if(sub_row) {
                        generateActualRow(JSON.parse(JSON.stringify(worksheetBluePrint.table.sub_row.columns)), sub_row, sub_row_level  + 1)
                    }
                }
            }
        }

        generateActualRow(JSON.parse(JSON.stringify(worksheetBluePrint.table.columns)), extractedWorksheet)
        return consolidated_worksheet
    }
}


class WorkbookBluePrintUtil {
    build(schema) {
        const resultObj = {"worksheets":[]}
        for(let i in schema.worksheets) {
            const worksheetSchema = schema.worksheets[i].worksheet_path
            const tableSchema = schema.worksheets[i].table_path
            const worksheet = require(worksheetSchema)
            worksheet["table"] = require(tableSchema)
            resultObj.worksheets.push(worksheet)
        }
        return resultObj
    }
}


export default (srcPath, workbook_schema)=>{
    const workbookBluePrintUtil = new WorkbookBluePrintUtil()
    const extractionUtil = new ExtractionUtil()

    const workbookBluePrint = workbookBluePrintUtil.build(workbook_schema)
    const extractedWorksheetPromises = []
    for(let i in workbookBluePrint.worksheets) {
        const worksheetBluePrint = workbookBluePrint.worksheets[i]
        const ps = extractionUtil.extract(srcPath, worksheetBluePrint).then((extractWorksheet)=>{
            return Promise.resolve(extractionUtil.consolidate(worksheetBluePrint, extractWorksheet))
        })
        //console.log(extractionUtil.extract(srcPath, workbookBluePrint.worksheets[i]))
        extractedWorksheetPromises.push(ps)
    }

    return Promise.all(extractedWorksheetPromises).then((extractedWorksheets)=>{
       //\ console.log(extractedWorksheets)
        return {
            "creator": workbook_schema.creator,
            "lastModifiedBy": workbook_schema.lastModifiedBy,
            "created": new Date(),
            "modified": new Date(),
            "worksheets": extractedWorksheets
        }
    })
}