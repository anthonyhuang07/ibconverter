const subject = document.getElementById("subject")
const raw = document.getElementById("mark")
const raw2 = document.getElementById("mark2")
const raw21 = document.getElementById("mark21")
const raw22 = document.getElementById("mark22")
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
    "./assets/images/level1.avif",
    "./assets/images/level2.avif",
    "./assets/images/level3.avif",
    "./assets/images/level4.avif",
    "./assets/images/level5.avif",
    "./assets/images/level6.avif",
    "./assets/images/level7.avif"
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

// conversion tables, keyed by subject index, fetched at most once each
const tables = {}

function loadTable(index) {
    if (tables[index] === undefined) {
        tables[index] = fetch(jsons[index]).then(response => response.json())
    }
    return tables[index]
}

// the student's raw mark out of 100, or undefined when the inputs are empty
function readMark() {
    if (mode.value == "raw") {
        if (raw.value == "") return undefined
        return parseInt(Math.floor(parseFloat(raw.value)))
    }
    if (raw21.value == "" || raw22.value == "") return undefined
    return parseInt(Math.floor(parseFloat(raw21.value / raw22.value) * 100))
}

bottom()
updateCurve(null)

// reset or change conversion on subject change
subject.addEventListener('change', function (e) {
    e.preventDefault();
    if (c == true) {
        convert()
    } else {
        updateCurve(null)
    }
    bottom()
})

mode.addEventListener('change', function (e) {
    c = false
    raw.value = raw21.value = raw22.value = ""
    result.innerHTML = `
    <h2 id="converted">Converted Mark</h2>
    <img src="./assets/images/default.avif" width="150px" id="joobi" alt="cookie muncher"/>`

    if (mode.value == "raw"){
        raw.style.display = "inline-block"
        raw2.style.display = "none"
    } else if (mode.value == "frac"){
        raw.style.display = "none"
        raw2.style.display = "flex"
    }

    updateCurve(null)
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

    let textSpan = document.createElement("span");
    let colSpan = document.createElement("span");

    const val = readMark()

    if (!Number.isFinite(val) || val < 0 || val > 100) {
        alert(mode.value == "raw" ? "Please enter a valid number." : "Please enter a valid mark.")
        return
    }

    updateCurve(val)

    loadTable(subject.value)
        .then(data => {
            converted.innerHTML = ""
            joobi.src = ""

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

    loadTable(subject.value)
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