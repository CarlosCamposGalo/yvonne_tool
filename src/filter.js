const filter = (filtersconf) => {

    return () => {
        let omit = true;
        for(filter in filtersconf) {
            const col_name = filter.column_name;
            const col_data_type = filter.col_data_type;
            const conditions = filter.conditions;
        } 
        return omit;
    }
    
}