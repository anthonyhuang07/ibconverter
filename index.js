const subject = document.getElementById("subject")
const raw = document.getElementById("raw")
const result = document.getElementById("result")

const emojis = [
    "./assets/images/level1.png",
    "./assets/images/level2.png",
    "./assets/images/level3.png",
    "./assets/images/level4.png",
    "./assets/images/level5.png",
    "./assets/images/level6.png",
    "./assets/images/level7.png"
];


function convert() {
    result.innerHTML = ""

    let val = Math.floor(parseFloat(raw.value));
    let img = document.createElement("img"); //
    let span = document.createElement("span");
    let colSpan = document.createElement("span");
    fetch('./data/eng.json')
        .then(response => response.json())
        .then(data => {
            for (let level in data) {
                if (data[level][val] !== undefined) {
                    let levelNumber = parseInt(level.match(/\d+/)[0], 10) - 1;
                    if (levelNumber >= 0 && levelNumber < emojis.length) {
                        img.src = emojis[levelNumber];
                        img.style.width = "150px";
                        img.alt = "Level " + (levelNumber + 1);
                    }
                    colSpan.innerHTML = level + ":&nbsp;"
                    span.innerHTML = data[level][val] + "%";
                    result.appendChild(img);
                    result.appendChild(colSpan);
                    result.appendChild(span);
                    break;
                }
            }
        });
}



function num(input) {
    let value = input.value;

    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
        value = value.replace(/^0+/, '');
    }

    if (value.match(/^100(\.0+)?$/)) {
        input.value = '100';
    } else if (!value.match(/^\d{0,3}(\.\d{0,2})?$/) || parseFloat(value) > 100) {
        input.value = value.slice(0, -1);
    } else {
        input.value = value;
    }
}
