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

class ReportUtil {

}

export default (workbook)=>{
    const workbookUtil = new WorkbookUtil()
    const workbookBluePrint = workbookUtil.build(workbook)
    console.log(JSON.stringify(workbookBluePrint))
}