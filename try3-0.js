// https://github.com/wollmich/metas-b-least/

import { levenbergMarquardt } from "ml-levenberg-marquardt"
import { Matrix, pseudoInverse } from "ml-matrix"
import { example1, example2 } from "./examples.js"
import { get10723 } from "./iso10723.js"

function linearFunc(y, b) {
    const [b0, b1] = b
    const x = y.map(value => b0 + b1 * value)
    const dxdy = y.map(() => b1)
    const dxdb = [y.map(() => 1), [...y]]

    return [x, dxdy, dxdb]
}

function secondOrderPoly(y, b) {
    const [b0, b1, b2] = b

    const x = y.map(value => b0 + b1 * value + b2 * value ** 2)

    const dxdy = y.map(value => b1 + 2 * b2 * value)

    const dxdb = [y.map(() => 1), [...y], y.map(value => value ** 2)]

    return [x, dxdy, dxdb]
}

function thirdOrderPoly(y, b) {
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

function quadraticStart(data) {
    const V = new Matrix(data.y.map(y => [1, y, y ** 2]))

    const X = new Matrix(data.x.map(x => [x]))

    return pseudoInverse(V)
        .mmul(X)
        .to2DArray()
        .map(row => row[0])
}

function cubicStart(data) {
    const V = new Matrix(data.y.map(y => [1, y, y ** 2, y ** 3]))

    const X = new Matrix(data.x.map(x => [x]))

    return pseudoInverse(V)
        .mmul(X)
        .to2DArray()
        .map(row => row[0])
}

function leastStart(data, func) {
    switch (func) {
        case linearFunc:
            return linearStart(data)
        case secondOrderPoly:
            return quadraticStart(data)
        case thirdOrderPoly:
            return cubicStart(data)
    }
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

// def b_least(cal_data, func):
function b_least(calData, func) {
    const n = calData.x.length

    const y2Start = [...calData.y]
    const bStart = leastStart(calData, func)

    const start = [...y2Start, ...bStart]
    const scale = start.map(value => (value === 0 ? 1 : value))
    const initialValues = start.map((value, i) => value / scale[i])

    const indices = Array.from({ length: 2 * n }, (_, i) => i)
    const zeros = indices.map(() => 0)

    function residualsInn(params) {
        return residuals(params, calData, scale, func)
    }

    function model(params) {
        const r = residualsInn(params)
        return index => r[index]
    }

    function jacobianModel(params) {
        const J = jacobian(params, calData, scale, func)
        return index => J[index]
    }

    const result = levenbergMarquardt(
        { x: indices, y: zeros },
        params => index => model(params)(index),
        {
            improvementThreshold: 0,
            dampingStepUp: 1,
            damping: 0.001,
            initialValues,
            jacobianFunction: params => index => jacobianModel(params)(index),
            // maxIterations: 1000,
            maxIterations: 10,
        },
    )
    ////
    // function sumSquares(params) {
    //     const r = residuals(params, calData, scale, func)
    //     return r.reduce((sum, value) => sum + value * value, 0)
    // }

    // const p = [...result.parameterValues]
    // const r = residuals(p, calData, scale, func)
    // const J = jacobian(p, calData, scale, func)

    // // Градієнт суми квадратів: grad = 2 * Jᵀ * r
    // const grad = Array(p.length).fill(0)

    // for (let i = 0; i < J.length; i++) {
    //     for (let j = 0; j < p.length; j++) {
    //         grad[j] += 2 * J[i][j] * r[i]
    //     }
    // }

    // const maxGrad = Math.max(...grad.map(Math.abs))

    // console.log("SSE:", sumSquares(p))
    // console.log("max |gradient|:", maxGrad)
    // console.log("gradient:", grad)

    // if (maxGrad > 0 && Number.isFinite(maxGrad)) {
    //     for (const alpha of [1e-8, 1e-7, 1e-6, 1e-5, 1e-4, 1e-3, 1e-2]) {
    //         const candidate = p.map((value, j) => value - (alpha * grad[j]) / maxGrad)

    //         console.log(`alpha=${alpha}`, sumSquares(candidate))
    //     }
    // }

    // // const j = 6
    // // const h = 1e-5

    // // const plus = [...p]
    // // const minus = [...p]
    // // plus[j] += h
    // // minus[j] -= h

    // // const numericDerivative = (sumSquares(plus) - sumSquares(minus)) / (2 * h)

    // // console.log("Analytical derivative:", grad[j])
    // // console.log("Numerical derivative:", numericDerivative)

    // const j = 6
    // const h = 1e-5

    // const plus = [...p]
    // const minus = [...p]
    // plus[j] += h
    // minus[j] -= h

    // const rPlus = residuals(plus, calData, scale, func)
    // const rMinus = residuals(minus, calData, scale, func)

    // const numericResidualDerivative = r.map((_, i) => (rPlus[i] - rMinus[i]) / (2 * h))

    // const analyticalResidualDerivative = J.map(row => row[j])

    // console.log("Analytical dR/dp:", analyticalResidualDerivative)
    // console.log("Numerical dR/dp:", numericResidualDerivative)
    // console.log(
    //     "Analytical dSSE/dp:",
    //     2 * analyticalResidualDerivative.reduce((sum, value, i) => sum + value * r[i], 0),
    // )
    // console.log("Numerical dSSE/dp:", (sumSquares(plus) - sumSquares(minus)) / (2 * h))

    // console.log(
    //     "SSE direct:",
    //     r.reduce((s, v) => s + v * v, 0),
    // )
    // console.log("SSE function:", sumSquares(p))

    // console.log(
    //     "SSE plus direct:",
    //     rPlus.reduce((s, v) => s + v * v, 0),
    // )
    // console.log("SSE plus function:", sumSquares(plus))

    // console.log(
    //     "SSE minus direct:",
    //     rMinus.reduce((s, v) => s + v * v, 0),
    // )
    // console.log("SSE minus function:", sumSquares(minus))

    // console.log(
    //     "residuals(p) SSE:",
    //     residuals(p, calData, scale, func).reduce((s, v) => s + v * v, 0),
    // )

    // console.log("p:", p)
    // console.log("result.parameterValues:", result.parameterValues)
    // console.log("scale:", scale)

    // const r1 = residuals(p, calData, scale, func)
    // const r2 = residuals(result.parameterValues, calData, scale, func)

    // console.log("r1:", r1)
    // console.log("r2:", r2)
    // console.log(
    //     "SSE r1:",
    //     r1.reduce((s, v) => s + v * v, 0),
    // )
    // console.log(
    //     "SSE r2:",
    //     r2.reduce((s, v) => s + v * v, 0),
    // )

    const p = [...result.parameterValues]
    const r = residuals(p, calData, scale, func)
    const J = jacobian(p, calData, scale, func)

    const sse = r.reduce((sum, value) => sum + value * value, 0)

    const grad = Array(p.length).fill(0)
    for (let i = 0; i < J.length; i++) {
        for (let j = 0; j < p.length; j++) {
            grad[j] += 2 * J[i][j] * r[i]
        }
    }

    console.log("SSE:", sse)
    console.log("gradient:", grad)

    for (const j of [0, 6, 7, 8, 9, 10]) {
        const h = 1e-5
        const plus = [...p]
        const minus = [...p]

        plus[j] += h
        minus[j] -= h

        const ssePlus = residuals(plus, calData, scale, func).reduce((s, v) => s + v * v, 0)

        const sseMinus = residuals(minus, calData, scale, func).reduce((s, v) => s + v * v, 0)

        console.log(j, {
            analytical: grad[j],
            numerical: (ssePlus - sseMinus) / (2 * h),
        })
    }
    /////

    const y2bOpt = result.parameterValues.map((value, i) => value * scale[i])

    const bOpt = y2bOpt.slice(n)
    const bOptCov = covariance(result.parameterValues, calData, scale, func)
    const bRes = residualsInn(result.parameterValues)

    // debug!

    function sumSquares(values) {
        return values.reduce((sum, value) => sum + value * value, 0)
    }

    // console.log("initialValues")
    // const r0 = residualsInn(initialValues)
    // console.log(r0)
    // console.log(sumSquares(r0))
    console.log("parameterValues")
    console.log(bRes)
    console.log(sumSquares(bRes))
    console.log("it:", result.iterations)
    // console.log("bStart:", bStart)
    // console.log("scale:", scale)
    // // console.log("paramsStart:", paramsStart)
    // console.log("paramsFinal:", result.parameterValues)

    return [bOpt, bOptCov, bRes]
}

function present(b, bCov, bRes) {
    const uncertainties = bCov.map((row, i) => Math.sqrt(row[i]))

    const residualSum = bRes.reduce((sum, value) => sum + value * value, 0)

    const maxAbsDeviation = Math.max(...bRes.map(value => Math.abs(value)))

    console.log("Coefficients b")
    console.log(b)

    console.log("Uncertainties u(b)")
    console.log(uncertainties)

    console.log("Covariance cov(b)")
    console.table(bCov)

    console.log("Residual")
    console.log(residualSum)

    console.log("Maximum absolute value of weighted deviations")
    console.log(maxAbsDeviation)
}

export function test1() {
    // const re = b_least(example1, linearFunc)
    // console.log(re)
    // present(...re)

    // console.group("example 2, linear:")
    // present(...b_least(example2, linearFunc))
    // console.groupEnd()

    // console.group("example 2, quadratic:")
    // present(...b_least(example2, secondOrderPoly))
    // console.groupEnd()

    // console.group("example 2, cubic:")
    // present(...b_least(example2, thirdOrderPoly))
    // console.groupEnd()

    const ex4 = get10723(0)
    const ex4c = { x: ex4.y, ux: ex4.uy, y: ex4.x, uy: ex4.ux }
    // console.log(ex4.name)
    console.log(ex4)
    // console.table(ex4, ["x", "y"])
    // console.log(ex4.x.map((x, i) => `${x}\t${ex4.ux[i]}\t${ex4.y[i]}\t${ex4.uy[i]}`).join("\n"))

    // console.group("ISO 10723, linear a:")
    // present(...b_least(ex4, linearFunc))
    // console.groupEnd()

    // console.group("ISO 10723, linear c:")
    // present(...b_least(ex4c, linearFunc))
    // console.groupEnd()

    // console.group("ISO 10723, quadratic a:")
    // present(...b_least(ex4, secondOrderPoly))
    // console.groupEnd()

    // console.group("ISO 10723, quadratic c:")
    // present(...b_least(ex4c, secondOrderPoly))
    // console.groupEnd()

    console.group("ISO 10723, cubic a:")
    present(...b_least(ex4, thirdOrderPoly))
    console.groupEnd()

    console.group("ISO 10723, cubic c:")
    present(...b_least(ex4c, thirdOrderPoly))
    console.groupEnd()
}
