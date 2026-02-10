const TICKET = 120
const DRINKS = 18
const COMENSALES = 6
function calcular() {
    return (TICKET - DRINKS) / COMENSALES
}

console.log(calcular());