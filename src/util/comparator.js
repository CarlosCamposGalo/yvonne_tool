
const fn = (operator) => {
    switch(operator) {
        case "-":
            return (param1, param2) => param1 - param2;
        case "*":
            return (param1, param2) => param1 * param2;
        case "/":
            return (param1, param2) => param1 / param2;
        case "<":
            return (param1, param2) => param1 < param2;
        case ">":
            return (param1, param2) => param1 > param2;
        case "<=":
            return (param1, param2) => param1 <= param2;
        case ">=":
            return (param1, param2) => param1 >= param2;
        case "+":
            return (param1, param2) => param1 + param2;
        case "===":
                return (param1, param2) => param1 === param2;
        default:
            return (param1, param2) => param1 + param2;
    }
}

const date_comparator = (operator) => {
    return (param1, param2) => {
        const param1Time = param1.getTime()
        const param2Time = param2.getTime()
        return fn(operator)(param1Time, param2Time)
    }
    
}

const comparatorfactory = (data_type, operator) => {
    const data_type_lowercased = data_type.toLowerCase();
    if (data_type_lowercased === 'date') {
        return date_comparator(operator)
    }
}

export default comparatorfactory