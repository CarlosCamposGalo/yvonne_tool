const conditionalFactory = (operator) => {
    switch(operator) {
        case "&&":
            return (param1, param2) => param1 && param2
        case "||":
            return (param1, param2) => param1 || param2
        default:
            return (param1, param2) => param1 || param2
    }
}

export default conditionalFactory