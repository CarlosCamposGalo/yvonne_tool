import {Excel} from 'exceljs'

class ReportUtil {

}

export default (data)=>{
    const workbook = new Excel.Workbook()
    workbook.creator = data.creator
    workbook.lastModifiedBy = data.lastModifiedBy
    workbook.created = data.created
    workbook.modified = data.modified
    
    for(let i in data.page){
        const data_worksheet = data.page[i].worksheeet
        const data_table = data.page[i].table
        const worksheet = workbook.addWorkshet(data_worksheet.worksheet_name)
    }   
}