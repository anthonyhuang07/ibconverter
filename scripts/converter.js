const subject = document.getElementById("subject")
const raw = document.getElementById("raw")
const result = document.getElementById("result")
const converter = document.getElementById("converter")
const converted = document.getElementById("converted")
const icon = document.getElementById("icon")
const subjecth2 = document.getElementById("subjecth2")

const sectionlvl = document.getElementById("section-lvl")
const sectionraw = document.getElementById("section-raw")
const sectionconv = document.getElementById("section-conv")

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

const subjects = [
    "HL English",
    "SL French",
    "HL French",
    "SL Spanish",
    "HL Economics",
    "HL Geography",
    "SL Business",
    "SL Chemistry",
    "HL Chemistry",
    "SL Biology",
    "HL Biology",
    "SL Physics",
    "SL Math",
    "HL Math"
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

// converted status
let c = false

bottom()

// reset or change conversion on subject change
subject.addEventListener('change', function(e){
    e.preventDefault();
    if(c == true){
        convert()
    }
    bottom()
})

// convert when pressed
converter.addEventListener('submit', function(e) {
    e.preventDefault();
    convert()
    c = true
})

// convert function
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
                    img.alt = level;

                    if (matchMedia('only screen and (max-width: 900px)').matches) {
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

function bottom(){
    sectionlvl.innerHTML = "<h3>Level</h3>"
    sectionraw.innerHTML = "<h3>Raw</h3>"
    sectionconv.innerHTML = "<h3>Converted</h3>"
    if (matchMedia('only screen and (max-width: 500px)').matches) {
        subjecth2.innerHTML = "Ranges - " + subjects[subject.value]
    } else {
        subjecth2.innerHTML = "Conversion Ranges - " + subjects[subject.value]
    }

    fetch(jsons[subject.value])
    .then(response => response.json())
    .then(data => {
        for (let level in data) {
            let levelNum = parseInt(level.match(/\d+/)[0], 10) - 1;
            const subkey = Object.keys(data[level]);

            let p1 = document.createElement("p")
            p1.innerHTML = level
            p1.style.color = colors[levelNum]

            let p2 = document.createElement("p")
            p2.innerHTML = subkey[0] + "-" + subkey[subkey.length-1]

            let p3 = document.createElement("p")
            p3.innerHTML = data[level][subkey[0]] + "-" + data[level][subkey[subkey.length-1]]

            sectionlvl.appendChild(p1)
            sectionraw.appendChild(p2)
            sectionconv.appendChild(p3)
        }
    })
}
