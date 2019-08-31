import Excel from 'exceljs'

export default (workbookData, destPath) => {
    const workbook = new Excel.Workbook()
    workbook.creator = workbookData.creator
    workbook.lastModifiedBy = workbookData.lastModifiedBy
    workbook.lastModifiedBy = workbookData.lastMifiedBy
    workbook.created = workbookData.created
    workbook.modified = workbookData.modified
    
    for(let i in workbookData.worksheets){
        const worksheetData = workbookData.worksheets[i]
        const worksheet = workbook.addWorksheet(worksheetData.worksheet_name)
        worksheet.columns=worksheetData.columns
        console.log(worksheetData.columns)
        for(let j in worksheetData.rows){
            console.log(worksheetData.rows[j])
            worksheet.addRow(worksheetData.rows[j])
        }
            
    }
    return workbook.xlsx.writeFile(destPath)
}