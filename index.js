const subject = document.getElementById("subject")
const raw = document.getElementById("raw")
const result = document.getElementById("result")
const converter = document.getElementById("converter")
const date = document.getElementById("date")
const converted = document.getElementById("converted")
const icon = document.getElementById("icon")

const emojis = [
    "./assets/images/level1.png",
    "./assets/images/level2.png",
    "./assets/images/level3.png",
    "./assets/images/level4.png",
    "./assets/images/level5.png",
    "./assets/images/level6.png",
    "./assets/images/level7.png"
];

const jsons = [
    "./data/eng.json",
    "./data/fsf.json",
    "./data/fif.json",
    "./data/esp.json",
    "./data/econ.json",
    "./data/geo.json",
    "./data/bbb.json",
    "./data/scha.json",
    "./data/schb.json",
    "./data/sbia.json",
    "./data/sbib.json",
    "./data/sph.json",
    "./data/mtha.json",
    "./data/mthb.json"
]

const colors = [
    "#f94144",
    "#f3722c",
    "#f8961e",
    "#f9c74f",
    "#90be6d",
    "#43aa8b",
    "#2CBCED"
]

let c = false

d = new Date()
date.innerHTML = d.getFullYear()

if (matchMedia('only screen and (max-width: 500px)').matches) {
    icon.className = "fa-sharp fa-solid fa-arrow-down"
}

subject.addEventListener('change', function(e){
    e.preventDefault();
    if(c == true){
        convert()
    }
})

converter.addEventListener('submit', function(e) {
    e.preventDefault();
    convert()
    c = true
})

function convert(){
    result.innerHTML = ""
    converted.innerHTML = "";

    let val = Math.floor(parseFloat(raw.value));
    let img = document.createElement("img");
    let text = document.createElement("h2");
    let textSpan = document.createElement("span");
    let colSpan = document.createElement("span");
    fetch(jsons[subject.value])
        .then(response => response.json())
        .then(data => {
            for (let level in data) {
                if (data[level][val] !== undefined) {
                    let levelNum = parseInt(level.match(/\d+/)[0], 10) - 1;
                    img.src = emojis[levelNum];
                    img.style.width = "150px";
                    img.alt = "Level " + (levelNum + 1);

                    if (matchMedia('only screen and (max-width: 500px)').matches) {
                        colSpan.innerHTML = level
                        location.href = "#sub"
                    } else {
                        colSpan.innerHTML = level + ":&nbsp;"
                    }

                    colSpan.style.color = colors[levelNum]
                    textSpan.innerHTML = data[level][val] + "%";

                    text.id = "converted"
                    text.appendChild(colSpan);
                    text.appendChild(textSpan);

                    result.appendChild(text)
                    result.appendChild(img);

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
