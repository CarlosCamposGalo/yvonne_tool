
const fn = (operator) => {
    switch(operator) {
        case "<":
            return (param1, param2) => param1 < param2;
        case ">":
            return (param1, param2) => param1 > param2;
        case "<=":
            return (param1, param2) => param1 <= param2;
        case ">=":
            return (param1, param2) => param1 >= param2;
        case "===":
            return (param1, param2) => param1 === param2;
        case "!==":
            return (param1, param2) => param1 !== param2;
        case "startswith":
            return (param1, param2) => param1.startsWith(param2);
        case "endswith":
             return (param1, param2) => param1.endsWith(param2);
        case "contains":
            return (param1, param2) => param1.toLowerCase().contains(param2.toLowerCase())
        case "!contains":
                return (param1, param2) => !param1.toLowerCase().contains(param2.toLowerCase())
        default:
            return (param1, param2) => param1 === param2;
    }
}

const date_comparator = (operator) => {
    return (param1, param2) => {
        const param1Time = param1.getTime()
        const param2Time = param2.getTime()
        return fn(operator)(param1Time, param2Time)
    }
    
}

const string_comparator = (operator) => {
    return (param1, param2) => {
        const param1Time = param1 ? param1.toLowerCase() : param1
        const param2Time = param2 ? param2.toLowerCase() : param2
        return fn(operator)(param1Time, param2Time)
    }
    
}

const number_comparator = (operator) => {
    return (param1, param2) => {
        return fn(operator)(Number(param1), Number(param2))
    }
}

const comparatorfactory = (data_type, operator) => {
    const data_type_lowercased = data_type.toLowerCase();
    const operator_lowercased = operator.toLowerCase();
    if (data_type_lowercased === 'date') {
        return date_comparator(operator_lowercased)
    } else if(data_type_lowercased === 'number') {
         return number_comparator(operator_lowercased)
    }

    return string_comparator(operator_lowercased)
}

export default comparatorfactory