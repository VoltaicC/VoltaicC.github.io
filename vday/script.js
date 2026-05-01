document.addEventListener("DOMContentLoaded", function () {
    const imageFolder = "pics/";
    const imageCount = 14;
    const carouselInner = document.querySelector(".carousel-inner");
    const noBtn = document.getElementById("no-btn");
    const yesBtn = document.getElementById("yes-btn");

    for (let i = 1; i <= imageCount; i++) {
        let img = document.createElement("img");
        img.dataset.src = `${imageFolder}image${i}.jpg`;
        if (i === 1) img.src = img.dataset.src;
        carouselInner.appendChild(img);
    }

    let images = document.querySelectorAll(".carousel img");
    let currentIndex = 0;
    images[currentIndex].style.display = "block";

    function nextImage() {
        images[currentIndex].style.display = "none";
        currentIndex = (currentIndex + 1) % images.length;
        let nextImg = images[currentIndex];

        if (!nextImg.src) {
            nextImg.src = nextImg.dataset.src;
        }

        nextImg.style.display = "block";
    }

    setInterval(nextImage, 2000);

    document.addEventListener("mousemove", function (e) {
        const rect = noBtn.getBoundingClientRect();
        const threshold = 100;
        const distance = Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2));
        
        if (distance < threshold) {
            noBtn.style.transition = "opacity 0.5s ease";
            noBtn.style.opacity = "0";
            noBtn.style.pointerEvents = "none";
        } else {
            noBtn.style.transition = "opacity 0.5s ease";
            noBtn.style.opacity = "1";
            noBtn.style.pointerEvents = "auto";
        }
    });

    yesBtn.addEventListener("click", function () {
        let message = document.createElement("div");
        message.innerText = "Ayy thanks, good choice!";
        message.style.position = "fixed";
        message.style.top = "50%";
        message.style.left = "50%";
        message.style.transform = "translate(-50%, -50%)";
        message.style.fontSize = "3rem";
        message.style.fontWeight = "bold";
        message.style.color = "#d63384";
        document.body.appendChild(message);

        for (let i = 0; i < 30; i++) {
            let heart = document.createElement("div");
            heart.classList.add("heart");
            heart.innerHTML = ["❤️", "💖", "💗", "💕", "💞"][Math.floor(Math.random() * 5)];
            heart.style.left = Math.random() * 100 + "vw";
            heart.style.top = "-10px";
            heart.style.fontSize = (Math.random() * 20 + 10) + "px";
            heart.style.animationDuration = (Math.random() * 3 + 2) + "s";
            document.body.appendChild(heart);

            setTimeout(() => {
                heart.remove();
            }, 3000);
        }
    });
});
