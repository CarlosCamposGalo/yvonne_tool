const fn = (operator) => {
    switch(operator) {
        case "+":
            return (param1, param2) => param1 + param2;
        case "-":
            return (param1, param2) => param1 - param2;
        case "/":
            return (param1, param2) => param1 / param2;
        case "*":
            return (param1, param2) => param1 * param2;
        case "=":
            return (param1, param2) => param2;
        default:
            return (param1, param2) => param1 + param2;
    }
}


const factory = (operator) => {
    return (param1, param2) => {
        return fn(operator)(param1, param2)
    }
}

export default factory