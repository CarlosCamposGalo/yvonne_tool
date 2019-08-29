
export const CastFactory = (data_type) => {
    switch(data_type.toLowerCase()) {
        case "date":
            return (param1) => new Date(param1)
        case "number":
            return (param1) => Number(param1)
        default:
            return (param1) => param1
    }
}