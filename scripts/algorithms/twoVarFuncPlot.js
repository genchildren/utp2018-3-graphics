'use strict';

window.onload = () => surfacePlot();


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

class Point3D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Point2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function funcFromString(f) {
    f = f.replace(/\^/g, '**');
    return (x, y) => eval(f);
}

const f = funcFromString("sin(x*y)*cos(x+y)");

const n = 400; //number of pieces
const a = -20; //X borders
const b = 20;
const c = -20; //Y borders
const d = 20;

const dx = (b - a) / n;
const dy = (d - c) / n;

let max = -Infinity;
let min = Infinity;

//const start = new Point3D(a, c, f(a, c));

const arr = [];

for (let i = a, idx = 0; i <= b; i += dx, idx++) {
    arr.push([]);
    for (let j = c, jdx = 0; j <= d; j += dy, jdx++) {
        arr[idx].push(new Point3D(i, j, f(i, j)));
        max = Math.max(arr[idx][jdx].z, max);
        min = Math.min(arr[idx][jdx].z, min);
    }
}

//----------------------------------
const checkedPoints = new Set();
//----------------------------------

let border = 0;

class MarchingSquare {

    constructor(h) {
        this.h = h;
        this.NONE = 0;
        this.UP = 1;
        this.LEFT = 2;
        this.DOWN = 3;
        this.RIGHT = 4;

        this.lastStep = this.NONE;
        this.nextStep = this.LEFT;
        //this.border = false;

        this.i = 0;
        this.j = 0;

        this.x0 = 0;
        this.y0 = 0;
    }

    findStartPoint() { //Ищет для каждого уровня начальные точки для всех линий данного уровня
        for (; this.i < arr.length; this.i++) {
            this.j = 0;
            for (; this.j < arr.length; this.j++) {
                if (arr[this.i][this.j].z < this.h && !checkedPoints.has(arr[this.i][this.j].x*1000 + arr[this.i][this.j].y)) {
                    //console.log(arr[this.i][this.j].x, arr[this.i][this.j].y);
                    this.x0 = this.i;
                    this.y0 = this.j;
                    checkedPoints.add(arr[this.i][this.j].x*1000 + arr[this.i][this.j].y);
                    return true;
                }
            }
        }
        return false;
    }


    buildLine() {
        border = 0;
        const linePoints = [];
        let x = this.x0, y = this.y0;
        for (; ;) {
            this.moveNext(x, y);
            if (x == 0 || y == 0 || x == n-1 || y == n-1) {
                border++;
            }
            if (x > 0 && x < n && y > 0 && y < n) { //what if x == 0 or y == 0 ?
                //console.log(x, y);
                checkedPoints.add(arr[x][y].x*1000 + arr[x][y].y);
                let X, Y;
                switch (this.nextStep) { //Попытка в интерполяцию на основе стороны в направлении которой мы пойдем дальше
                    case this.UP:
                        Y = arr[x][y].y;
                        X = arr[x - 1][y].x + (arr[x][y].x - arr[x - 1][y].x) * (this.h - arr[x - 1][y].z) / (arr[x][y].z - arr[x - 1][y].z);
                        linePoints.push([X, Y]);
                        break;
                    case this.DOWN:
                        X = arr[x - 1][y - 1].x + (arr[x][y - 1].x - arr[x - 1][y - 1].x) * (this.h - arr[x - 1][y - 1].z) / (arr[x][y - 1].z - arr[x - 1][y - 1].z);
                        Y = arr[x][y-1].y;
                        linePoints.push([X, Y]);
                        break;
                    case this.RIGHT:
                        Y = arr[x][y - 1].y + (arr[x][y].y - arr[x][y - 1].y) * (this.h - arr[x][y - 1].z) / (arr[x][y].z - arr[x][y - 1].z);
                        X = arr[x][y].x;
                        linePoints.push([X, Y]);
                        break;
                    case this.LEFT:
                        Y = arr[x - 1][y - 1].y + (arr[x - 1][y].y - arr[x - 1][y - 1].y) * (this.h - arr[x - 1][y - 1].z) / (arr[x - 1][y].z - arr[x - 1][y - 1].z);
                        X = arr[x - 1][y].x;
                        linePoints.push([X, Y]);
                        break;
                }
                //linePoints.push([arr[x][y].x, arr[x][y].y]);
            }
            switch (this.nextStep) {
                case this.UP:
                    y++;
                    break;
                case this.LEFT:
                    x--;
                    break;
                case this.DOWN:
                    y--;
                    break;
                case this.RIGHT:
                    x++;
                    break;
                default:
                    break;
            }
            if (border == 100) break;
            if (x === this.x0 && y === this.y0) break;
        }

        return linePoints;
    }

    check(x, y) {
        if (x === n - 1 || y === n - 1 || x === 0 || y === 0) this.border = true;
        if (x < 0 || y < 0 || x >= n || y >= n) return false;
        return arr[x][y].z < this.h;
    }

    moveNext(x, y) {
        let state = 0;

        const leftTop = this.check(x - 1, y - 1);
        const rightTop = this.check(x, y - 1);
        const bottomLeft = this.check(x - 1, y);
        const bottomRight = this.check(x, y);


        //this.lastStep = this.nextStep;

        if (leftTop) state |= 1;
        if (rightTop) state |= 2;
        if (bottomLeft) state |= 4;
        if (bottomRight) state |= 8;

        switch (state) {
            case 1:
                this.nextStep = this.DOWN;
                break;
            case 2:
                this.nextStep = this.RIGHT;
                break;
            case 3:
                this.nextStep = this.RIGHT;
                break;
            case 4:
                this.nextStep = this.LEFT;
                break;
            case 5:
                this.nextStep = this.DOWN;
                break;
            case 6:
                if (this.nextStep == this.DOWN) {  // info from previous_step
                    this.nextStep = this.LEFT;
                } else {
                    this.nextStep = this.RIGHT;
                }
                break;
            case 7:
                this.nextStep = this.RIGHT;
                break;
            case 8:
                this.nextStep = this.UP;
                break;
            case 9:
                if (this.nextStep == this.RIGHT) {  // info from previous_step
                    this.nextStep = this.DOWN;
                } else {
                    this.nextStep = this.UP;
                }
                break;
            case 10:
                this.nextStep = this.UP;
                break;
            case 11:
                this.nextStep = this.UP;
                break;
            case 12:
                this.nextStep = this.LEFT;
                break;
            case 13:
                this.nextStep = this.DOWN;
                break;
            case 14:
                this.nextStep = this.LEFT;
                break;
            default:
                this.nextStep = this.NONE;  // this should never happen
                break;
        }
    }
}

function getColorizer(min, max) {
    const k = Math.abs(max - min) / 5;
    return (h) => {
        const M = Math.abs(h - min) / k;
        //console.log(M);
        const Mq = Math.ceil(M);
        switch (Mq) {
            case 1:
                return 'rgb(' + Math.floor(255 * (1 - M)) + ',0,255)';
            case 2:
                return 'rgb(0,' + Math.floor(255 * (M - 1)) + ',255)';
            case 3:
                return 'rgb(0,255' + Math.floor(255 * (3 - M)) + ')';
            case 4:
                return 'rgb(' + Math.floor(255 * (M - 3)) + ',255,0)';
            case 5:
                return 'rgb(255,' + Math.floor(255 * (5 - M)) + ',0)';
        }
    }
}

function mouseCoordinates(canvas, evnt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evnt.clientX - rect.left,
        y: evnt.clientY - rect.top
    };
}

function axisPlot() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const clientWidth = canvas.clientWidth;
    const clientHeight = canvas.clientHeight;

    const x0 = clientWidth / 2;
    const y0 = clientHeight / 2;

    ctx.strokeRect(0, 400, 800, 0.5);
    ctx.strokeRect(400, 0, 0.5, 800);

    canvas.addEventListener('mousemove', (evnt) => {
        const coordinates = mouseCoordinates(canvas, evnt);
        ctx.clearRect(canvas.width - 100, canvas.height - 20, 100, 20);
        ctx.font = '10pt Calibri';
        ctx.fillStyle = 'black';
        ctx.fillText( (coordinates.x - canvas.width/2+15) + ' ' + (coordinates.y - canvas.height/2+100), canvas.width - 80, canvas.height - 10);
    }, false);

}

function surfacePlot() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const clientWidth = canvas.width;
    const clientHeight = canvas.height;

    const x0 = clientWidth / 2;
    const y0 = clientHeight / 2;


    axisPlot();

    console.log(x0, y0);

    let step = (max-min)/80;
    const heightToColor = getColorizer(min, max);
    console.log(min, max);
    for (let height = min+0.1; height <= max; height += step) {
        //if (height > max/1.5 && height < max/1.45) {
            ctx.strokeStyle = heightToColor(height);
            const ms = new MarchingSquare(height);
            while (ms.findStartPoint()) {
                ctx.beginPath();
                const array = ms.buildLine();
                for (let elem of array) {
                   // console.log(elem[0], elem[1]);
                    ctx.lineTo(400 + elem[0] * 20, 400 + elem[1] * 20);
                }
                //ctx.closePath();
                ctx.stroke();
                ctx.closePath();
            }
        //}
            //step += 0.4;
    }

}
