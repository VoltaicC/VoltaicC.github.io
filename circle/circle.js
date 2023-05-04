// Desc: Draws a circle using the midpoint circle algorithm
//http://en.wikipedia.org/wiki/Midpoint_circle_algorithm

var canvas = document.querySelector('canvas')
var ctx = canvas.getContext('2d');

var slider = document.getElementById('slider');

var DrawPixel = function (x, y) {
    ctx.fillRect(x, y, 1, 1);
}

slider.oninput = function () {
    DrawCircle(slider.value, slider.value, slider.value);
}

var DrawCircle = function (x0, y0, radius) {
    // typecast all inputs to numbers
    x0 = Number(x0);
    y0 = Number(y0);
    radius = Number(radius);
    canvas.width = 1 + radius * 2;
    canvas.height = 1 + radius * 2;
    ctx.fillStyle = 'white';

    var x = radius;
    var y = 0;
    var radiusError = 1 - x;

    while (x >= y) {
        DrawPixel(x + x0, y + y0);
        DrawPixel(y + x0, x + y0);
        DrawPixel(-x + x0, y + y0);
        DrawPixel(-y + x0, x + y0);
        DrawPixel(-x + x0, -y + y0);
        DrawPixel(-y + x0, -x + y0);
        DrawPixel(x + x0, -y + y0);
        DrawPixel(y + x0, -x + y0);
        y++;

        if (radiusError < 0) {
            radiusError += 2 * y + 1;
        }
        else {
            x--;
            radiusError += 2 * (y - x + 1);
        }
    }
};

DrawCircle(1,1,1)
