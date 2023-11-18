// Set the target date and time (YYYY, MM, DD, HH, MM, SS)
const targetDate = new Date("2023-12-01T00:03:00").getTime();



function createConfetti() {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");

    // Randomize the confetti's color
    const randomColor = getRandomColor();
    confetti.style.backgroundColor = randomColor;

    // Randomize the confetti's initial position above the screen
    const randomX = Math.random() * window.innerWidth;
    const randomY = -20; // Start above the screen
    const randomRotation = Math.random() * 360;

    confetti.style.left = randomX + "px";
    confetti.style.top = randomY + "px"; // Set top to start above the screen
    confetti.style.transform = `rotate(${randomRotation}deg)`;

    document.body.appendChild(confetti);

    // Remove the confetti element after it falls out of view
    confetti.addEventListener("animationiteration", () => {
        document.body.removeChild(confetti);
    });
}

function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}



// Update the countdown every second
const countdown = setInterval(function() {
    const now = new Date().getTime();
    const timeRemaining = targetDate - now;

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    document.getElementById("days").textContent = String(days).padStart(2, '0');
    document.getElementById("hours").textContent = String(hours).padStart(2, '0');
    document.getElementById("minutes").textContent = String(minutes).padStart(2, '0');
    document.getElementById("seconds").textContent = String(seconds).padStart(2, '0');

    if (timeRemaining <= 0) {
        clearInterval(countdown);
        document.getElementById("label").remove();
        document.getElementById("countdown").innerHTML = "<p>WOOOOOOOOOOOOOO</p>";
    // Create and continuously append confetti elements
setInterval(createConfetti, 2); // Adjust the interval as needed
        
    }
}, 1000);
