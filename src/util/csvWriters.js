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
            console.log("Writing rows to csv file...")
            if(this.chunk.length)
                return this.writer.writeRecords(this.chunk).then(()=>{
                    this.state = "ready"
                    this.worker = null
                    this.chunk = []
                    return Promise.resolve()
                })
            return Promise.resolve()
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

    finalize(cb=()=>{console.log("CSV write ended.")}) {
        this.queue = false
        setTimeout(() => this.writeRecords(null).then(cb()), 1000)
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
        return instance  ? instance.writer : {finalize: ()=>{console.log("There are no writer built fot the path ", key)}}
    }

    build(path, headers) {
        const instance_writer = this.get(path)
        if(!instance_writer.writeRecords) {
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

    finalize() {
        this.instances.forEach(el=> {
            el.writer.finalize(()=>{
                console.log(`CSV written to path ${el.key}`)
            })
        })
    }

}

export default new CsvWritersHandler()


