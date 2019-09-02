import comparator from './../operation/comparator'
class SortUtil {
    sortObjectByFieldValue(object, compareFn){
        const sorted = {}
        Object.keys(object).sort(compareFn).forEach(key =>{sorted[key]=object[key]})
        return sorted
    }
}

export default new SortUtil()