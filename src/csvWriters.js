import Promise from 'promise'
import {createObjectCsvWriter} from 'csv-writer'

class CsvWriter {

    constructor(instance){
        this.chunk = []
        this.records = [] 
        this.state = "ready"
        this.writer = instance
        this.worker = null
        this.queue = false
    }

    _writeToFile(){
        if(this.state === "ready") {
            this.state = "busy"
            this.chunk = this.records
            this.records = []
            console.log("Writing to file...")
            return this.writer.writeRecords(this.chunk).then(()=>{
                this.state = "ready"
                this.worker = null
                this.chunk = []
                return Promise.resolve()
            })
        } else { 
            return Promise.resolve()
        }
    }

    writeRecords(row){
        if (row) this.records.push(row)
        if(!this.worker) {
            this.worker = new Promise((resolve, reject) => {
                resolve(this._writeToFile()) 
            })
        } else if(!this.queue){
            this.queue = true
            this.worker.then(() => {
                return setTimeout(()=>{
                    this.queue = false
                    this._writeToFile()
                }, 500)
            })
        }
        return this.worker
    }

    finalize(cb=()=>{console.log("CSV write indeed.")}) {
        this.queue = false
        setTimeout(() => this.writeRecords(null).then(cb()), 1000)
    }
}

class CsvWritersHandler {
    constructor() {
        this.instances = []
    }

    finalize() {
        this.instances.forEach(el=> {
            el.writer.finalize(()=>{
                console.log(`CSV written to path ${el.key}`)
            })
        })
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
            console.log(`New Writer to path: ${path}`)
            this.instances.push({"key": path, "writer": writer})
            return writer
        } else {
            return instance_writer
        }
    }
}

export default new CsvWritersHandler()


