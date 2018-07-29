'use strict';

try {
    window.onerror = (e) => {
        alert('Потрачено.')
    };
    window.onload = () => plot(f, a, b);
} catch (e) {
    alert('Ошибка. Проверьте правильность ввода и повторите попытку.')
}

const sqrt = (x) => Math.sqrt(x);
const sin = (x) => Math.sin(x);
const cos = (x) => Math.cos(x);
const tg = (x) => Math.tan(x);
const tan = tg;
const abs = (x) => Math.abs(x);
const log = (x) => Math.log(x);
const asin = (x) => Math.asin(x);
const acos = (x) => Math.acos(x);
const atan = (x) => Math.atan(x);
const e = 2.71;
const pi = 3.14;

class Point2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function funcFromString(f) {
    f = f.replace(/\^/g, '**');
    return (x) => eval(f);
}

const f = funcFromString('haha you fool'); //Когда нибудь здесь будет пользовательский ввод, возможно


const a = -20, b = 20; // вводит пользователь (нет)
const c = -100, d = 100; //дефолтные значения для промежутка по y
let max = -Infinity, min = Infinity;

let autoY = true;

function firstDerivative(x) {
    const der = (f(x + 0.0001) - f(x)) / 0.0001;
    if (!isNaN(der)) {
        return der;
    } else {
        return (f(x - 0.0001) - f(x)) / -0.0001;
    }
}

function secondDerivative(x1, x2, x3, y1, y2, y3) {
    return 2 * ((y3 - y2) / ((x3 - x2) * (x3 - x1)) - (y2 - y1) / ((x2 - x1) * (x3 - x1)));
}



function getXScale() {
    return 800 / (b - a);
}

function getYScale(max, min) {
    if (autoY) {
        if (max > min) {
            return 800 / abs(max - min);
        } else {
            return max === 0 ? 0 : 200 / max;
        }
    } else {
        return 800 / (d - c);
    }
}



let upAsympto = false;
let downAsympto = false;

const singularities = [];


function quadratureFirst(f1, f2, f3) {
    return 5 / 12 * f1 + 2 / 3 * f2 - 1 / 12 * f3;
}

function quadratureSecond(f1, f2, f3, f4) {
    return 3 / 8 * f1 + 19 / 24 * f2 - 5 / 24 * f3 + 1 / 24 * f4;
}



function getPointsSet(func, a, b, depth, epsilon, resultSet, refine = false) {

    const m = (a + b) / 2;

    const points = [a, (a + m) / 2, m, (m + b) / 2, b].map(x => new Point2D(x, func(x)));

    if (points.filter(point => !isNaN(point.y)).length === 0) {
        resultSet.add(new Point2D(m, NaN));
        return;
    }


    let locMin = Infinity;
    let locMax = -Infinity;
    for (let elem of points) {
        if (abs(elem.y) < locMin) {
            locMin = abs(elem.y);
        }
        locMax = Math.max(locMax, abs(elem.y));
    }

    if (depth <= 0) {
        resultSet.add(...points);
        return;
    }

    if (b <= 0) {
        //console.log(locMax);
    }

    const refineIsNeeded = checkSmoothness(points[0].y, points[1].y, points[2].y) ||
        checkSmoothness(points[1].y, points[2].y, points[3].y) ||
        checkSmoothness(points[2].y, points[3].y, points[4].y);

    if (!refineIsNeeded) {

        const summaryCurveRatio = abs(quadratureSecond(points[0].y, points[1].y, points[2].y, points[3].y) -
            quadratureFirst(points[2].y, points[3].y, points[4].y));

        if (summaryCurveRatio <= epsilon) {
            resultSet.add(...points);
            return;
        }

    } else if (!refine) {
        const fd = firstDerivative(m);
        if (locMax > 50 && abs(fd) > 200) {
            const sd = (firstDerivative(m+0.0001) - fd)/0.0001;
            if (sd < 0) {
                downAsympto = true;
            } else {
                upAsympto = true;
            }

            singularities.push({val: points[2].y, a: a, b: b, epsilon: epsilon, depth: depth});
            return;
        }
    } else {
        if (locMin > abs(max) || locMin > abs(min)) {
            resultSet.add(...points);
            return;
        }
    }

    getPointsSet(func, a, m, depth - 1, epsilon * 2, resultSet, refine);
    getPointsSet(func, m, b, depth - 1, epsilon * 2, resultSet, refine);
}

function checkSmoothness(a, b, c) {
    return checkCurve(a, b, c) || checkDegCase(a) ||
        checkDegCase(b) || checkDegCase(c);
}

function checkDegCase(a) {
    return isNaN(a) || !isFinite(a);
}

function checkCurve(a, b, c) {
    return (b < a && b < c) || (b > a && b > c);
}

function plot(func, a, b) {
    const delta = Math.min((b - a) / 100, 1);
    const N = delta * 100 === b - a ? 100 : b - a;
    const pointSet = new Set();
    for (let i = 1; i <= N; i++) {
        getPointsSet(func, a + (i - 1) * delta, a + i * delta, 10, 0.05, pointSet);
    }
    if (autoY) {
        for (let elem of pointSet) {
            if (isFinite(elem.y) && !isNaN(elem.y)) {
                if (elem.y > max) max = elem.y;
                if (elem.y < min) min = elem.y;
            }
        }
    } else {
        max = d;
        min = c;
    }

    console.log('maxmin', max, min);
    let top = Math.max(abs(max), abs(min));
    //const keknul = (max + min) / 2;
    const keknul = 0;
    if (autoY && upAsympto && downAsympto) {
        max = abs(top);
        min = -abs(top);
    }

    if (singularities.length > 0) { // Если асимптоты таки есть у нас вотс

        console.log(downAsympto, upAsympto);

        for (let i = 0; i < singularities.length; i++) {
            getPointsSet(f, singularities[i].a, singularities[i].b, 666, singularities[i].epsilon, pointSet, true);
        }
        console.log(singularities);
    }

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const canvHeight = canvas.height;
    const canvWidth = canvas.width;

    ctx.strokeRect(0, canvHeight / 2, canvWidth, 0.5);
    ctx.strokeRect(canvWidth / 2, 0, 0.5, canvHeight);
    ctx.strokeStyle = 'red';

    const x0 = canvWidth / 2;
    const y0 = canvHeight / 2;

    ctx.beginPath();

    const xScale = getXScale();
    const yScale = getYScale(max, min);

    console.log(xScale, yScale);


    const pointArr = [...pointSet].sort((a, b) => a.x - b.x);
    console.log('kek', singularities.length, downAsympto, upAsympto);

    for (let i = 0; i < pointArr.length; i++) {
        if (isNaN(pointArr[i].y)) {
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            continue;
        }
        if (pointArr[i].y > max || pointArr[i].y < min) {
            ctx.lineTo(x0 + pointArr[i].x * xScale, y0 - pointArr[i].y * yScale);
            ctx.stroke();
            ctx.closePath();
            while (i < pointArr.length && (pointArr[i].y > max || pointArr[i].y < min)) {
                i++;
            }
            i--;
            ctx.beginPath();
        }
        if (i < pointArr.length) {
            ctx.lineTo(x0 + pointArr[i].x * xScale, y0 - (pointArr[i].y - keknul) * yScale);
        }

    }

    ctx.moveTo(x0, y0);
    ctx.stroke();
    ctx.closePath();
}
