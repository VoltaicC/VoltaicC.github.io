// Get the canvas element
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
var selectedHand = "random"
// Set the canvas dimensions
canvas.width = window.innerWidth * .8;
canvas.height = window.innerHeight * .8;

// if the canvas is clicked, create a new object
canvas.addEventListener('click', function (event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    switch (selectedHand) {
        case "rock":
            objects.push(new Object(x, y, "rock"));
            break;
        case "paper":
            objects.push(new Object(x, y, "paper"));
            break;
        case "scissors":
            objects.push(new Object(x, y, "scissors"));
            break;
        case "random":
            const name = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
            objects.push(new Object(x, y, name));
            break;
    }
});

// Create an array to store the objects
const objects = [];

// Object constructor function
function Object(x, y, name) {
    this.x = x;
    this.y = y;
    this.radius = 40;
    this.name = name;
    this.velocity = {
        x: (Math.random() - 0.5) * 1, // Random initial x velocity
        y: (Math.random() - 0.5) * 1, // Random initial y velocity
    };
    switch (name) {
        case 'rock':
            this.hand = '🌑';
            break;
        case 'paper':
            this.hand = '📄';
            break;
        case 'scissors':
            this.hand = '✂️';
            break;
    }
}
// Draw the objects
Object.prototype.draw = function () {
    //draw circle around radius
    //set font size to fit radius
    ctx.font = `${this.radius * 2}px Arial`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.strokeStyle = 'black';
    //ctx.stroke();
    ctx.closePath();
    ctx.fillText(this.hand, this.x, this.y);
    //align text to center of circle
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
};

// Update the position of the objects
Object.prototype.update = function (objects) {
    this.draw();

    for (let i = 0; i < objects.length; i++) {
        if (this === objects[i]) continue;

        // bounce of top and sides of canvas
        if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
            this.velocity.x = -this.velocity.x;
        }
        if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
            this.velocity.y = -this.velocity.y;
        }

        // collision detection
        if (getDistance(this.x, this.y, objects[i].x, objects[i].y) - this.radius * 2 < 0) {
            resolveCollision(this, objects[i]);
        }

        //move objects
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // limit velocity
        const limitVelocity = (value, limit) => {
            if (value > limit) {
                return limit;
            } else if (value < -limit) {
                return -limit;
            }
            return value;
        };

        this.velocity.x = limitVelocity(this.velocity.x, 0.1);
        this.velocity.y = limitVelocity(this.velocity.y, 0.1);

    }
};

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < objects.length; i++) {
        objects[i].update(objects);
    }
}

// Get the distance between two objects
function getDistance(x1, y1, x2, y2) {
    const xDistance = x2 - x1;
    const yDistance = y2 - y1;

    // Pythagorean theorem
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

function resolveCollision(object1, object2) {
    const xVelocityDiff = object1.velocity.x - object2.velocity.x;
    const yVelocityDiff = object1.velocity.y - object2.velocity.y;

    const xDistance = object2.x - object1.x;
    const yDistance = object2.y - object1.y;

    // Prevent accidental overlap of objects
    if (xVelocityDiff * xDistance + yVelocityDiff * yDistance >= 0) {
        const angle = -Math.atan2(yDistance, xDistance);

        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);

        // Rotate the velocity vectors
        const vel1 = {
            x: object1.velocity.x * cosAngle - object1.velocity.y * sinAngle,
            y: object1.velocity.x * sinAngle + object1.velocity.y * cosAngle
        };

        const vel2 = {
            x: object2.velocity.x * cosAngle - object2.velocity.y * sinAngle,
            y: object2.velocity.x * sinAngle + object2.velocity.y * cosAngle
        };

        // Calculate the final velocities after collision in the rotated coordinate system
        const finalVel1 = {
            x: vel2.x,
            y: vel1.y
        };

        const finalVel2 = {
            x: vel1.x,
            y: vel2.y
        };

        // Rotate the final velocity vectors back
        object1.velocity.x = finalVel1.x * cosAngle + finalVel1.y * sinAngle;
        object1.velocity.y = finalVel1.y * cosAngle - finalVel1.x * sinAngle;

        object2.velocity.x = finalVel2.x * cosAngle + finalVel2.y * sinAngle;
        object2.velocity.y = finalVel2.y * cosAngle - finalVel2.x * sinAngle;
    }

    switch (object1.name) {
        case 'rock':
            if (object2.name === 'scissors') {
                object2.name = 'rock';
                object2.hand = '🌑';
                object2.draw();
            }
            if (object2.name === 'paper') {
                object1.name = 'paper';
                object1.hand = '📄';
                object1.draw();
            }
            break;

        case 'paper':
            if (object2.name === 'rock') {
                object2.name = 'paper';
                object2.hand = '📄';
                object2.draw();
            }

            if (object2.name === 'scissors') {
                object1.name = 'scissors';
                object1.hand = '✂️';
                object1.draw();
            }

            break;

        case 'scissors':
            if (object2.name === 'paper') {
                object2.name = 'scissors';
                object2.hand = '✂️';
                object2.draw();
            }
            if (object2.name === 'rock') {
                object1.name = 'rock';
                object1.hand = '🌑';
                object1.draw();
            }
            break;
    }
}


function wipeCanvas() {
    while (objects.length > 0) {
        objects.pop();
    }
}

function reset() {
    wipeCanvas();
    createObjects();
}

function createObjects() {
    const names = ['rock', 'paper', 'scissors', 'rock', 'paper', 'scissors'];

    for (let i = 0; i < 6; i++) {
        const radius = 40;
        const x = Math.random() * (canvas.width - radius * 2) + radius;
        const y = Math.random() * (canvas.height - radius * 2) + radius;

        objects.push(new Object(x, y, names[i]));
    }
}

// Initialize the simulation
function init() {
    createObjects();
    animate();
}

// Call the init function
init();
