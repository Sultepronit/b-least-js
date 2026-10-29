// https://github.com/wollmich/metas-b-least/

import { levenbergMarquardt } from "ml-levenberg-marquardt";
import { Matrix, pseudoInverse } from "ml-matrix";
import { example1, example2 } from "./examples.js";
import { get10723 } from "./iso10723.js";
import { getScaleFactor } from "./helpers.js";

// def b_linear_func(y, b):
function linearFunc(y, b) {
    const [b0, b1] = b;
    const x = y.map(value => b0 + b1 * value);
    const dxdy = y.map(() => b1);
    const dxdb = [y.map(() => 1), [...y]];

    return [x, dxdy, dxdb];
}

// def b_second_order_poly(y, b):
function qudraticFunc(y, b) {
    const [b0, b1, b2] = b;

    const x = y.map(value => b0 + b1 * value + b2 * value ** 2);

    const dxdy = y.map(value => b1 + 2 * b2 * value);

    const dxdb = [y.map(() => 1), [...y], y.map(value => value ** 2)];

    return [x, dxdy, dxdb];
}

function cubicFunc(y, b) {
    const [b0, b1, b2, b3] = b;

    const x = y.map(value => b0 + b1 * value + b2 * value ** 2 + b3 * value ** 3);

    const dxdy = y.map(value => b1 + 2 * b2 * value + 3 * b3 * value ** 2);

    const dxdb = [y.map(() => 1), [...y], y.map(value => value ** 2), y.map(value => value ** 3)];

    return [x, dxdy, dxdb];
}

// def b_objective_func(x, ux, y, uy, y2, b, func):  # pylint: disable=R0913, R0917
function objectiveFunc(data, y2, b, func) {
    const x2 = func(y2, b)[0];

    const wdx = x2.map((value, i) => (value - data.x[i]) / data.ux[i]);

    const wdy = y2.map((value, i) => (value - data.y[i]) / data.uy[i]);

    return [...wdx, ...wdy];
}

// def calculate_start(cal_data, func):
function leastStart(data, func) {
    const degree = func === linearFunc ? 1 : func === qudraticFunc ? 2 : 3;
    // return Array(degree + 1).fill(1)
    const V = new Matrix(data.y.map(y => Array.from({ length: degree + 1 }, (_, i) => y ** i)));

    const X = new Matrix(data.x.map(x => [x]));

    return pseudoInverse(V)
        .mmul(X)
        .to2DArray()
        .map(row => row[0]);
}

// def _b_jacobian(params, cal_data, y2_b_scale, func):  # pylint: disable=R0914
function jacobian(params, data, scale, func) {
    const n = data.x.length;
    const nb = scale.length - n;

    const actual = params.map((value, i) => value * scale[i]);

    const y2 = actual.slice(0, n);
    const b = actual.slice(n);

    const y2Scale = scale.slice(0, n);
    const bScale = scale.slice(n);

    const uy = data.uy;
    const ux = data.ux;

    const f = func(y2, b);
    const dx2dy2 = f[1];
    const dx2db = f[2];

    const jacobi = Array.from({ length: 2 * n }, () => Array(n + nb).fill(0));

    for (let i = 0; i < n; i++) {
        jacobi[i][i] = (dx2dy2[i] * y2Scale[i]) / ux[i];

        for (let j = 0; j < nb; j++) {
            jacobi[i][n + j] = (dx2db[j][i] * bScale[j]) / ux[i];
        }

        jacobi[n + i][i] = y2Scale[i] / uy[i];
    }

    return jacobi;
}

function transpose(matrix) {
    return matrix[0].map((_, j) => matrix.map(row => row[j]));
}

function multiply(a, b) {
    const bt = transpose(b);

    return a.map(row => bt.map(col => row.reduce((sum, value, i) => sum + value * col[i], 0)));
}

// def _b_covariance(params, cal_data, y2_b_scale, func):  # pylint: disable=R0914
function covariance(params, data, scale, func) {
    const n = data.x.length;
    const bScale = scale.slice(n);

    const J = new Matrix(jacobian(params, data, scale, func));

    const maxDim = Math.max(J.rows, J.columns);
    const JPinv = pseudoInverse(J, 1e-15 / maxDim).to2DArray();

    const dbDg = JPinv.slice(n).map(row => row.map(value => -value));

    const scaled = dbDg.map((row, i) => row.map(value => value * bScale[i]));

    return multiply(scaled, transpose(scaled));
}

// def _b_residuals(params, cal_data, y2_b_scale, func):
function residuals(params, data, scale, func) {
    const n = data.x.length;

    const actual = params.map((value, i) => value * scale[i]);
    const y2 = actual.slice(0, n);
    const b = actual.slice(n);

    return objectiveFunc(data, y2, b, func);
}

function prepareInput(inputdata) {
    // x & y exchange to return to common sense!
    let xScale = getScaleFactor(inputdata.y);
    let yScale = getScaleFactor(inputdata.x);

    const preparedData = { x: [], ux: [], y: [], uy: [] };
    for (let i = 0; i < inputdata.y.length; i++) {
        preparedData.y[i] = inputdata.x[i] / yScale;
        preparedData.uy[i] = inputdata.ux[i] / yScale;
        preparedData.x[i] = inputdata.y[i] / xScale;
        preparedData.ux[i] = inputdata.uy[i] / xScale;
    }

    return { preparedData, xScale, yScale };
}

function calculate(inputdata, func) {
    const { preparedData, xScale, yScale } = prepareInput(inputdata);
    // console.log(preparedData);

    const n = preparedData.x.length;

    const y2Start = [...preparedData.y];
    const bStart = leastStart(preparedData, func);

    const start = [...y2Start, ...bStart];

    const scale = start.map(value => (value === 0 ? 1 : value));

    const initialValues = start.map((value, i) => value / scale[i]);

    const indices = Array.from({ length: 2 * n }, (_, i) => i);
    const zeros = indices.map(() => 0);

    function residualsInn(params) {
        return residuals(params, preparedData, scale, func);
    }

    function model(params) {
        const r = residualsInn(params);
        return index => r[index];
    }

    function jacobianModel(params) {
        const J = jacobian(params, preparedData, scale, func);
        return index => J[index];
    }

    let result = null;
    let params = initialValues;
    let prevErr = Infinity;
    const it = 2;

    for (let i = 0; i < 100; i++) {
        result = levenbergMarquardt(
            { x: indices, y: zeros },
            params => index => model(params)(index),
            {
                initialValues: params,
                jacobianFunction: params => index => jacobianModel(params)(index),
                maxIterations: it,
            },
        );

        if (prevErr / result.parameterError < 1.000001) {
            console.log((i + 1) * it);
            break;
        }

        prevErr = result.parameterError;
        params = result.parameterValues;
    }

    const y2bOpt = result.parameterValues.map((value, i) => value * scale[i]);

    const x_ = y2bOpt.slice(0, n).map(v => v * yScale);
    // console.log("x^:", x_);

    const bOpt = y2bOpt.slice(n);
    const bOptCov = covariance(result.parameterValues, preparedData, scale, func);
    const bRes = residualsInn(result.parameterValues);

    const { u, gamma } = parseResults(bOpt, bOptCov, bRes, xScale, yScale);

    // return [bOpt, bOptCov, bRes, x_];
    return {
        a: bOpt,
        u,
        x_,
        S: result.parameterError,
        gamma,
    };
}

function parseResults(bOpt, bCov, bRes, xScale, yScale) {
    // console.log(bOptCov)
    for (let i = 0; i < bCov.length; i++) {
        for (let j = 0; j < bCov[i].length; j++) {
            const factorX = Math.pow(yScale, i + j);
            bCov[i][j] *= Math.pow(xScale, 2) / factorX;
        }
    }

    bOpt[0] *= xScale;
    bOpt[1] *= xScale / yScale;
    bOpt[2] = (bOpt[2] * xScale) / yScale ** 2 || 0;
    bOpt[3] = (bOpt[3] * xScale) / yScale ** 3 || 0;

    const u = bCov.map((row, i) => Math.sqrt(row[i]));

    const gamma = Math.max(...bRes.map(value => Math.abs(value)));
    // console.log(uncertainties, gamma);
    return { u, gamma };
}

export default function getFit(data, order, type = "x") {
    const func = order === 1 ? linearFunc : order === 2 ? qudraticFunc : cubicFunc;
    if (type === "y") {
        const revData = {
            x: data.y,
            ux: data.uy,
            y: data.x,
            uy: data.ux,
        };
        return calculate(revData, func);
    }
    return calculate(data, func);
}

function present(b, bCov, bRes) {
    const uncertainties = bCov.map((row, i) => Math.sqrt(row[i]));

    // const residualSum = bRes.reduce((sum, value) => sum + value * value, 0)

    const maxAbsDeviation = Math.max(...bRes.map(value => Math.abs(value)));

    console.log("Coefficients b");
    console.log(b);

    console.log("Uncertainties u(b)");
    console.log(uncertainties);
    // for (let i = 0; i < b.length; i++) {
    //     console.log((uncertainties[i] / b[i]) * 100)
    // }

    // console.log("Covariance cov(b)")
    // console.table(bCov)

    // console.log("Residual")
    // console.log(residualSum)

    console.log("Maximum absolute value of weighted deviations");
    console.log(maxAbsDeviation);
}
