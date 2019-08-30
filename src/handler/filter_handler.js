import ComparatorFactory from '../operation/comparator'
import ConditionalFactory from '../operation/conditional'
import {CastFactory} from '../operation/datatype'

const filter = (filtersconf) => {
    return (row) => {
        let result = false;
        
        for(const index in filtersconf) {
            const filter = filtersconf[index]
            const col_name = filter.column_name;
            const col_data_type = filter.column_data_type;
            const conditions = filter.conditions;
            for(const index2 in conditions) {
                let conditionResult  = false;
                const condition = conditions[index2]
                for(const index3 in condition.compares) {
                    const compare = conditions[index2].compares[index3]
                    const comparatorFn = ComparatorFactory(col_data_type, compare.operator)
                    const compare_conditionalFn = ConditionalFactory(compare.conditional)
                    const castFn = CastFactory(col_data_type)
                    conditionResult = compare_conditionalFn(comparatorFn(castFn(row[col_name]), castFn(compare.operand)), conditionResult)
                }
                const condition_conditionalFn = ConditionalFactory(condition.conditional)
                result = condition_conditionalFn(result, conditionResult)
            }  
        } 
        return result;
    }
}

export default filter