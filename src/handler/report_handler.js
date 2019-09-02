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
        for(let j in worksheetData.rows){
            worksheet.addRow(worksheetData.rows[j].row)
            const row = worksheet.lastRow
            if(worksheetData.rows[j].sub_row_level == 0){
                row.getCell(1).font = {
                    name: 'Comic Sans MS',
                    family: 'Arial',
                    size: 11,
                    bold: true
                  };
            } else if(worksheetData.rows[j].sub_row_level == 1 ) {
               row.fill = {
                    type: 'pattern',
                    pattern: 'darkVertical',
                    fsgColor: {
                        argb: 'd3d3d3'
                    }
                }
            }

         }
    }
    return workbook.xlsx.writeFile(destPath)
}