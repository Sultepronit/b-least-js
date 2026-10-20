// https://github.com/wollmich/metas-b-least/

import { example1 } from "./examples.js"

// def b_linear_func(y, b):
function linearFunc(y, b) {
    const [b0, b1] = b
    const x = y.map(value => b0 + b1 * value)
    const dxdy = y.map(() => b1)
    const dxdb = [y.map(() => 1), [...y]]

    return [x, dxdy, dxdb]
}

// def b_objective_func(x, ux, y, uy, y2, b, func):  # pylint: disable=R0913, R0917
function objectiveFunc(data, y2, b, func = linearFunc) {
    const x2 = func(y2, b)

    const wdx = x2.map((value, i) => (value - data.x[i]) / data.ux[i])

    const wdy = y2.map((value, i) => (value - data.y[i]) / data.uy[i])

    return [...wdx, ...wdy]
}

// def b_least_start(cal_data, func):
// PART
function linearStart(data) {
    const n = data.x.length

    let sumY = 0
    let sumX = 0
    let sumYY = 0
    let sumYX = 0

    for (let i = 0; i < n; i++) {
        sumY += data.y[i]
        sumX += data.x[i]
        sumYY += data.y[i] * data.y[i]
        sumYX += data.y[i] * data.x[i]
    }

    const denominator = n * sumYY - sumY * sumY

    if (denominator === 0) {
        throw new Error("Неможливо визначити початкову пряму")
    }

    const b1 = (n * sumYX - sumY * sumX) / denominator
    const b0 = (sumX - b1 * sumY) / n

    return [b0, b1]
}

// def _b_jacobian(params, cal_data, y2_b_scale, func):  # pylint: disable=R0914
function jacobian(params, data, scale, func) {
    const n = data.x.length
    const nb = scale.length - n

    // Повертаємо параметри до їхнього справжнього масштабу.
    const actual = params.map((value, i) => value * scale[i])

    const y2 = actual.slice(0, n)
    const b = actual.slice(n)

    const y2Scale = scale.slice(0, n)
    const bScale = scale.slice(n)

    const uy = data.uy
    const ux = data.ux

    // Очікуємо: [x2, dx2/dy2, dx2/db].
    const f = func(y2, b)
    const dx2dy2 = f[1]
    const dx2db = f[2]

    // Матриця 2n × (n + nb), заповнена нулями.
    const jacobi = Array.from({ length: 2 * n }, () => Array(n + nb).fill(0))

    for (let i = 0; i < n; i++) {
        // Залишок за x.
        jacobi[i][i] = (dx2dy2[i] * y2Scale[i]) / ux[i]

        for (let j = 0; j < nb; j++) {
            jacobi[i][n + j] = (dx2db[j][i] * bScale[j]) / ux[i]
        }

        // Залишок за y.
        jacobi[n + i][i] = y2Scale[i] / uy[i]
    }

    return jacobi
}

export function test1() {
    const b0 = [0, 0.5]
    const y2 = example1.y

    console.log(linearFunc(example1.y, b0))
    const b = linearStart(example1)
    console.log(b)
    console.log(objectiveFunc(example1, example1.y, b))

    const start = [...y2, ...b]

    const scale = start.map(value => (value === 0 ? 1 : value))

    const params = start.map((value, i) => value / scale[i])

    const jac = jacobian(params, example1, scale, linearFunc)

    console.log("params:", params)
    console.table(jac)
}
