// https://github.com/wollmich/metas-b-least/

import { levenbergMarquardt } from "ml-levenberg-marquardt"
import { Matrix, pseudoInverse } from "ml-matrix"
import { example1, example2 } from "./examples.js"
import { get10723 } from "./iso10723.js"
import { getScaleFactor } from "./helpers.js"

// def b_linear_func(y, b):
function linearFunc(y, b) {
    const [b0, b1] = b
    const x = y.map(value => b0 + b1 * value)
    const dxdy = y.map(() => b1)
    const dxdb = [y.map(() => 1), [...y]]

    return [x, dxdy, dxdb]
}

// def b_second_order_poly(y, b):
function qudraticFunc(y, b) {
    const [b0, b1, b2] = b

    const x = y.map(value => b0 + b1 * value + b2 * value ** 2)

    const dxdy = y.map(value => b1 + 2 * b2 * value)

    const dxdb = [y.map(() => 1), [...y], y.map(value => value ** 2)]

    return [x, dxdy, dxdb]
}

function cubicFunc(y, b) {
    const [b0, b1, b2, b3] = b

    const x = y.map(value => b0 + b1 * value + b2 * value ** 2 + b3 * value ** 3)

    const dxdy = y.map(value => b1 + 2 * b2 * value + 3 * b3 * value ** 2)

    const dxdb = [y.map(() => 1), [...y], y.map(value => value ** 2), y.map(value => value ** 3)]

    return [x, dxdy, dxdb]
}

// def b_objective_func(x, ux, y, uy, y2, b, func):  # pylint: disable=R0913, R0917
function objectiveFunc(data, y2, b, func) {
    const x2 = func(y2, b)[0]

    const wdx = x2.map((value, i) => (value - data.x[i]) / data.ux[i])

    const wdy = y2.map((value, i) => (value - data.y[i]) / data.uy[i])

    return [...wdx, ...wdy]
}

// def calculate_start(cal_data, func):
function leastStart(data, func) {
    const degree = func === linearFunc ? 1 : func === qudraticFunc ? 2 : 3
    // return Array(degree + 1).fill(1)
    const V = new Matrix(data.y.map(y => Array.from({ length: degree + 1 }, (_, i) => y ** i)))

    const X = new Matrix(data.x.map(x => [x]))

    return pseudoInverse(V)
        .mmul(X)
        .to2DArray()
        .map(row => row[0])
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

function transpose(matrix) {
    return matrix[0].map((_, j) => matrix.map(row => row[j]))
}

function multiply(a, b) {
    const bt = transpose(b)

    return a.map(row => bt.map(col => row.reduce((sum, value, i) => sum + value * col[i], 0)))
}

// def _b_covariance(params, cal_data, y2_b_scale, func):  # pylint: disable=R0914
function covariance(params, data, scale, func) {
    const n = data.x.length
    const bScale = scale.slice(n)

    const J = new Matrix(jacobian(params, data, scale, func))

    // Узгоджуємо поріг із NumPy pinv за замовчуванням.
    const maxDim = Math.max(J.rows, J.columns)
    const JPinv = pseudoInverse(J, 1e-15 / maxDim).to2DArray()

    const dbDg = JPinv.slice(n).map(row => row.map(value => -value))

    const scaled = dbDg.map((row, i) => row.map(value => value * bScale[i]))

    return multiply(scaled, transpose(scaled))
}

// def _b_residuals(params, cal_data, y2_b_scale, func):
function residuals(params, data, scale, func) {
    const n = data.x.length

    const actual = params.map((value, i) => value * scale[i])
    const y2 = actual.slice(0, n)
    const b = actual.slice(n)

    return objectiveFunc(data, y2, b, func)
}

function calculate(inputdata, func, useScale = true) {
    let xScale = getScaleFactor(inputdata.x)
    let yScale = getScaleFactor(inputdata.y)
    // xScale = 1
    // yScale = 1
    if (!useScale) {
        xScale = 1
        yScale = 1
    }
    // console.log("scales:", xScale, yScale)
    const preparedData = { ...inputdata, x: [], ux: [], y: [], uy: [] }
    // preparedData.y = scaledY
    for (let i = 0; i < inputdata.y.length; i++) {
        preparedData.y[i] = inputdata.y[i] / yScale
        preparedData.uy[i] = inputdata.uy[i] / yScale
        preparedData.x[i] = inputdata.x[i] / xScale
        preparedData.ux[i] = inputdata.ux[i] / xScale
    }
    // console.log(preparedData)

    const n = preparedData.x.length

    const y2Start = [...preparedData.y]
    const bStart = leastStart(preparedData, func)

    const start = [...y2Start, ...bStart]

    const scale = start.map(value => (value === 0 ? 1 : value))

    const initialValues = start.map((value, i) => value / scale[i])

    const indices = Array.from({ length: 2 * n }, (_, i) => i)
    const zeros = indices.map(() => 0)

    function residualsInn(params) {
        return residuals(params, preparedData, scale, func)
    }

    function model(params) {
        const r = residualsInn(params)
        return index => r[index]
    }

    function jacobianModel(params) {
        const J = jacobian(params, preparedData, scale, func)
        return index => J[index]
    }

    let result = null
    let params = initialValues
    let prevErr = Infinity
    const it = 2
    // console.time("c")
    for (let i = 0; i < 100; i++) {
        // const result = levenbergMarquardt(
        result = levenbergMarquardt(
            { x: indices, y: zeros },
            params => index => model(params)(index),
            {
                // initialValues,
                initialValues: params,
                jacobianFunction: params => index => jacobianModel(params)(index),
                maxIterations: it,
                // errorTolerance: 1,
            },
        )
        // console.log(result)

        // console.log(prevErr / result.parameterError)
        if (prevErr / result.parameterError < 1.000001) {
            console.log((i + 1) * it)
            break
        }

        prevErr = result.parameterError
        params = result.parameterValues
    }
    // console.timeEnd("c")

    const y2bOpt = result.parameterValues.map((value, i) => value * scale[i])

    const bOpt = y2bOpt.slice(n)
    const bOptCov = covariance(result.parameterValues, preparedData, scale, func)
    const bRes = residualsInn(result.parameterValues)

    // console.log(bOptCov)
    for (let i = 0; i < bOptCov.length; i++) {
        for (let j = 0; j < bOptCov[i].length; j++) {
            const factorX = Math.pow(yScale, i + j)
            bOptCov[i][j] *= Math.pow(xScale, 2) / factorX
        }
    }

    bOpt[0] *= xScale
    bOpt[1] *= xScale / yScale
    bOpt[2] *= xScale / yScale ** 2
    bOpt[3] *= xScale / yScale ** 3

    return [bOpt, bOptCov, bRes]
}

function present(b, bCov, bRes) {
    const uncertainties = bCov.map((row, i) => Math.sqrt(row[i]))

    // const residualSum = bRes.reduce((sum, value) => sum + value * value, 0)

    const maxAbsDeviation = Math.max(...bRes.map(value => Math.abs(value)))

    console.log("Coefficients b")
    console.log(b)

    console.log("Uncertainties u(b)")
    console.log(uncertainties)
    // for (let i = 0; i < b.length; i++) {
    //     console.log((uncertainties[i] / b[i]) * 100)
    // }

    // console.log("Covariance cov(b)")
    // console.table(bCov)

    // console.log("Residual")
    // console.log(residualSum)

    console.log("Maximum absolute value of weighted deviations")
    console.log(maxAbsDeviation)
}

export function test1() {
    // const re = calculate(example1, linearFunc)
    // console.log(re)
    // present(...re)

    // console.group("example 2, linear:")
    // present(...calculate(example2, linearFunc))
    // console.groupEnd()

    // console.group("example 2, quadratic:")
    // present(...calculate(example2, secondOrderPoly))
    // console.groupEnd()

    // console.group("example 2, cubic:")
    // present(...calculate(example2, thirdOrderPoly))
    // console.groupEnd()

    const ex4 = get10723(2)
    const ex4c = { x: ex4.y, ux: ex4.uy, y: ex4.x, uy: ex4.ux }
    // console.log(ex4.name)
    console.log(ex4)

    console.group("ISO 10723, linear a:")
    present(...calculate(ex4, linearFunc))
    console.groupEnd()

    console.group("ISO 10723, linear c:")
    present(...calculate(ex4c, linearFunc))
    console.groupEnd()

    console.group("ISO 10723, quadratic a:")
    present(...calculate(ex4, qudraticFunc))
    console.groupEnd()

    console.group("ISO 10723, quadratic c:")
    present(...calculate(ex4c, qudraticFunc))
    console.groupEnd()

    console.group("ISO 10723, cubic a:")
    present(...calculate(ex4, cubicFunc))
    console.groupEnd()

    console.group("ISO 10723, cubic c:")
    present(...calculate(ex4c, cubicFunc))
    console.groupEnd()

    // console.group("ISO 10723, cubic c:")
    // present(...calculate(ex4c, thirdOrderPoly))
    // console.groupEnd()
}
