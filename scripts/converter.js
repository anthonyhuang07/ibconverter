const subject = document.getElementById("subject")
const raw = document.getElementById("mark")
const result = document.getElementById("result")
const converter = document.getElementById("converter")
const converted = document.getElementById("converted")
const icon = document.getElementById("icon")
const subjecth2 = document.getElementById("subjecth2")
const mode = document.getElementById("mode")
const joobi = document.getElementById("joobi")

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
subject.addEventListener('change', function (e) {
    e.preventDefault();
    if (c == true) {
        convert()
    }
    bottom()
})

mode.addEventListener('change', function (e) {
    const result = document.getElementById("result")
    const mode = document.getElementById("mode")

    mark.value = ""
    result.innerHTML = `
    <h2 id="converted"></h2>
    <img src="./assets/images/default.png" width="150px" id="joobi"/>`

    const converted = document.getElementById("converted")

    if(mode.value == "raw"){
        converted.innerHTML = "Converted Mark";
    } else if (mode.value == "conv"){
        converted.innerHTML = "Raw Mark"
    }
})

// convert when pressed
converter.addEventListener('submit', function (e) {
    e.preventDefault();
    convert()
    c = true
})

// convert function
function convert() {
    const converted = document.getElementById("converted")
    const joobi = document.getElementById("joobi")

    converted.innerHTML = ""
    joobi.src = "";

    let val = parseInt(Math.floor(parseFloat(mark.value)));
    let textSpan = document.createElement("span");
    let colSpan = document.createElement("span");

    fetch(jsons[subject.value])
        .then(response => response.json())
        .then(data => {
            if (mode.value == "raw"){
                for (let level in data) {
                    if (data[level][val] !== undefined) {
                        let levelNum = parseInt(level.match(/\d+/)[0], 10) - 1;
                        joobi.src = emojis[levelNum];
                        joobi.alt = level;

                        if (matchMedia('only screen and (max-width: 900px)').matches) {
                            colSpan.innerHTML = level
                            location.href = "#sub"
                        } else {
                            colSpan.innerHTML = level + ":&nbsp;"
                        }

                        colSpan.style.color = colors[levelNum]
                        textSpan.innerHTML = data[level][val] + "%";

                        converted.appendChild(colSpan);
                        converted.appendChild(textSpan);

                        break;
                    }
                }
            } else if (mode.value == "conv"){
                let raw = lvl = undefined;
                let cVal = -Infinity;
                
                for (let level in data) {
                    Object.keys(data[level]).forEach(key => {
                        let cKey = parseInt(key, 10);
                        let value = data[level][key];
                
                        if (value === val) {
                            if (raw === undefined || cKey > raw) {
                                raw = cKey;
                                lvl = level;
                            }
                        } else if (value < val && value > cVal) {
                            cVal = value;
                            raw = cKey;
                            lvl = "~" + level;
                        }
                    });
                }
                
                if (raw !== undefined && lvl !== undefined) {  
                    let levelNum = parseInt(lvl.match(/\d+/)[0], 10) - 1;
                    joobi.src = emojis[levelNum];
                    joobi.alt = lvl;
                
                    if (matchMedia('only screen and (max-width: 900px)').matches) {
                        colSpan.innerHTML = lvl;
                        location.href = "#sub";
                    } else {
                        colSpan.innerHTML = lvl + ":&nbsp;";
                    }
                
                    colSpan.style.color = colors[levelNum];
                    textSpan.innerHTML = raw + "%";
                
                    converted.appendChild(colSpan);
                    converted.appendChild(textSpan);
                }
            }
        });
}

function bottom() {
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
                p2.innerHTML = subkey[0] + "-" + subkey[subkey.length - 1]

                let p3 = document.createElement("p")
                p3.innerHTML = data[level][subkey[0]] + "-" + data[level][subkey[subkey.length - 1]]

                sectionlvl.appendChild(p1)
                sectionraw.appendChild(p2)
                sectionconv.appendChild(p3)
            }
        })
}
