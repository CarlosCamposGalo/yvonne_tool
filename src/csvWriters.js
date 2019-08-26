import Promise from 'promise'
import {createObjectCsvWriter} from 'csv-writer'

class CsvWriter {

    constructor(instance){
        this.chunk = []
        this.records = [] 
        this.state = "ready"
        this.writer = instance
        this.worker = null
    }

    _writeToFile(callback){
        if(this.state === "ready") {
            this.state = "busy"
            this.chunk = this.records
            this.records = []
            console.log("Writing to file...")
            this.writer.writeRecords(this.chunk).then(()=>{
                this.state = "ready"
                this.worker = null
                this.chunk = []
                callback(Promise.resolve())
            })
        }
    }

    writeRecords(row){
        this.records.push(row)
        if(!this.worker) {
            console.log("null worker")
            this.worker = new Promise((resolve, reject) => {
                this._writeToFile(resolve)
            })
        } else {
            console.log("added worker")
            this.worker.then(() => {return this._writeToFile(Promise.resolve)})
            
        }
        return this.worker
    }
}

class CsvWritersHandler {
    constructor() {
        this.instances = []
    }

    get(key) {
        const instance = this.instances.find((el)=>{
            return el.key.toLowerCase() === key.toLowerCase()
        })
        return instance  ? instance.writer : null
    }

    build(path, headers) {

        const instance_writer = this.get(path)
        if(!instance_writer) {
            const writer = new CsvWriter(createObjectCsvWriter({
                path: path,
                header: headers
            }));
            console.log("new Writer: Headers are: " + headers.join(","))
            this.instances.push({"key": path, "writer": writer})
            return writer
        } else {
            return instance_writer
        }
    }
}

export default new CsvWritersHandler()


