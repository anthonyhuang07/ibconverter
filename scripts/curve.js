// Fits a normal ("bell") curve to each subject's raw-mark distribution and draws it.
//
// How the curve is built:
//   1. data/distributions.json gives the % of candidates awarded each grade 1-7
//      worldwide in the IB May 2026 session.
//   2. data/<subject>.json gives this subject's grade boundaries on the raw-mark
//      scale, so we know the raw mark at which each grade starts.
//   3. If raw marks are normally distributed, the raw mark at the boundary into
//      grade k must equal mu + sigma * z_k, where z_k is the standard normal
//      quantile of the proportion of candidates scoring below that boundary.
//      Regressing the six boundaries on their six z scores therefore recovers
//      mu and sigma. Each boundary is weighted by the inverse of its sampling
//      variance, phi(z)^2 / (F(1-F)), so the sparse tails count for less.
//   4. A student's percentile is then the area under that curve to the left of
//      their raw mark.

const curveSection = document.getElementById("curve")
const curveTitle = document.getElementById("curveh2")
const curvePlot = document.getElementById("curve-plot")
const curvePercentile = document.getElementById("curve-percentile")
const curveDetail = document.getElementById("curve-detail")

let distributions = null

// --- normal distribution helpers ---

// Abramowitz & Stegun 7.1.26, accurate to ~1.5e-7
function erf(x) {
    const sign = x < 0 ? -1 : 1
    x = Math.abs(x)
    const t = 1 / (1 + 0.3275911 * x)
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
    return sign * y
}

// P(Z < z)
function normCdf(z) {
    return 0.5 * (1 + erf(z / Math.SQRT2))
}

// standard normal density
function normPdf(z) {
    return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI)
}

// inverse of normCdf (Acklam's rational approximation)
function normInv(p) {
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01]
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00]
    const low = 0.02425
    let q, r

    if (p < low) {
        q = Math.sqrt(-2 * Math.log(p))
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    }
    if (p > 1 - low) {
        q = Math.sqrt(-2 * Math.log(1 - p))
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    }
    q = p - 0.5
    r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

// --- fitting ---

// lowest raw mark of each level, e.g. [0, 16, 29, 43, 55, 65, 78]
function levelStarts(table) {
    const starts = []
    for (let level = 1; level <= 7; level++) {
        const marks = Object.keys(table["Level " + level]).map(Number)
        starts.push(Math.min(...marks))
    }
    return starts
}

// the six raw marks separating one grade from the next, half a mark below the
// first mark of the higher grade so the cut sits between the two integers
function gradeBarriers(starts) {
    const barriers = []
    for (let level = 1; level <= 6; level++) barriers.push(starts[level] - 0.5)
    return barriers
}

// weighted least squares of barrier = mu + sigma * z
function fitBellCurve(barriers, grades) {
    const total = grades.reduce((sum, pct) => sum + pct, 0)
    const epsilon = 0.0005 // half the 0.1% the IB rounds its percentages to
    let sw = 0, swz = 0, swb = 0, swzz = 0, swzb = 0
    let below = 0

    for (let i = 0; i < barriers.length; i++) {
        below += grades[i] / total
        const f = Math.min(1 - epsilon, Math.max(epsilon, below))
        const z = normInv(f)
        const w = (normPdf(z) * normPdf(z)) / (f * (1 - f))
        sw += w
        swz += w * z
        swb += w * barriers[i]
        swzz += w * z * z
        swzb += w * z * barriers[i]
    }

    const det = sw * swzz - swz * swz
    return {
        sigma: (sw * swzb - swz * swb) / det,
        mu: (swzz * swb - swz * swzb) / det
    }
}

function percentileOf(mark, fit) {
    return normCdf((mark - fit.mu) / fit.sigma) * 100
}

function ordinal(n) {
    const tens = n % 100
    if (tens >= 11 && tens <= 13) return n + "th"
    const ones = n % 10
    if (ones === 1) return n + "st"
    if (ones === 2) return n + "nd"
    if (ones === 3) return n + "rd"
    return n + "th"
}

// --- drawing ---

const W = 720, H = 348
const ML = 30, MR = 30, MT = 66, MB = 56
const PLOT_TOP = MT, PLOT_BOTTOM = H - MB
const GRADE_BASELINE = 22   // row of grade numbers above the plot
const PILL_TOP = 30         // marker label sits between that row and the plot

const px = mark => ML + (mark / 100) * (W - ML - MR)
const py = density => PLOT_BOTTOM - density * (PLOT_BOTTOM - PLOT_TOP)

// height of the bell at a raw mark, scaled so the peak is exactly 1
function bellHeight(mark, fit) {
    const z = (mark - fit.mu) / fit.sigma
    return Math.exp(-0.5 * z * z)
}

function bellPoints(from, to, fit) {
    const points = []
    for (let mark = from; mark <= to; mark += 0.5) points.push(px(mark).toFixed(2) + "," + py(bellHeight(mark, fit)).toFixed(2))
    points.push(px(to).toFixed(2) + "," + py(bellHeight(to, fit)).toFixed(2))
    return points
}

function buildSVG(fit, starts, mark) {
    const barriers = gradeBarriers(starts)
    const parts = []

    // the readout underneath carries the same information in words, so screen
    // readers are spared a run of loose axis numbers
    parts.push(`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">`)

    parts.push(`<defs>
        <linearGradient id="curve-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#77C3FE"/><stop offset="100%" stop-color="#2CBCED"/>
        </linearGradient>
        <linearGradient id="curve-shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#77C3FE" stop-opacity="0.45"/><stop offset="100%" stop-color="#2CBCED" stop-opacity="0.08"/>
        </linearGradient>
    </defs>`)

    // whole bell, filled faintly
    const curve = bellPoints(0, 100, fit)
    parts.push(`<path d="M ${curve.join(" L ")} L ${px(100)},${PLOT_BOTTOM} L ${px(0)},${PLOT_BOTTOM} Z" fill="#77C3FE" fill-opacity="0.07"/>`)

    // everything the student beat, filled solidly: this area is the percentile
    if (mark !== null) {
        const scored = bellPoints(0, mark, fit)
        parts.push(`<path d="M ${scored.join(" L ")} L ${px(mark)},${PLOT_BOTTOM} L ${px(0)},${PLOT_BOTTOM} Z" fill="url(#curve-shade)"/>`)
    }

    // dotted grade barriers
    for (let i = 0; i < barriers.length; i++) {
        parts.push(`<line x1="${px(barriers[i]).toFixed(2)}" y1="${PILL_TOP}" x2="${px(barriers[i]).toFixed(2)}" y2="${PLOT_BOTTOM}" stroke="${colors[i + 1]}" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round"/>`)
    }

    // the bell itself
    parts.push(`<path d="M ${curve.join(" L ")}" fill="none" stroke="url(#curve-stroke)" stroke-width="2.5" stroke-linejoin="round"/>`)

    // baseline
    parts.push(`<line x1="${px(0)}" y1="${PLOT_BOTTOM}" x2="${px(100)}" y2="${PLOT_BOTTOM}" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1"/>`)

    // grade number centred in its band
    for (let level = 1; level <= 7; level++) {
        const from = starts[level - 1]
        const to = level < 7 ? starts[level] - 1 : 100
        parts.push(`<text class="curve-grade" x="${px((from + to) / 2).toFixed(2)}" y="${GRADE_BASELINE}" fill="${colors[level - 1]}">${level}</text>`)
    }

    // raw mark at which each grade opens, plus the ends of the scale
    parts.push(`<text class="curve-tick" x="${px(0)}" y="${PLOT_BOTTOM + 20}">0</text>`)
    for (let level = 2; level <= 7; level++) {
        parts.push(`<text class="curve-tick" x="${px(starts[level - 1]).toFixed(2)}" y="${PLOT_BOTTOM + 20}" fill="${colors[level - 1]}">${starts[level - 1]}</text>`)
    }
    parts.push(`<text class="curve-tick" x="${px(100)}" y="${PLOT_BOTTOM + 20}">100</text>`)
    parts.push(`<text class="curve-axis" x="${W / 2}" y="${PLOT_BOTTOM + 42}">Raw mark (%)</text>`)

    // the student
    if (mark !== null) {
        const x = px(mark)
        const y = py(bellHeight(mark, fit))
        const label = String(mark)
        const pillW = Math.max(34, label.length * 11 + 18)
        const pillH = 28
        const pillX = Math.min(W - MR - pillW / 2, Math.max(ML + pillW / 2, x)) - pillW / 2

        parts.push(`<line x1="${x.toFixed(2)}" y1="${PILL_TOP + pillH}" x2="${x.toFixed(2)}" y2="${PLOT_BOTTOM}" stroke="#ffffff" stroke-opacity="0.85" stroke-width="2"/>`)
        parts.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="5" fill="#ffffff" stroke="hsl(210, 10%, 17.5%)" stroke-width="2"/>`)
        parts.push(`<rect x="${pillX.toFixed(2)}" y="${PILL_TOP}" width="${pillW}" height="${pillH}" rx="5" fill="hsl(210, 10%, 12.5%)" stroke="#77C3FE" stroke-width="1.5"/>`)
        parts.push(`<text class="curve-pill" x="${(pillX + pillW / 2).toFixed(2)}" y="${PILL_TOP + 19}">${label}</text>`)
    }

    parts.push(`</svg>`)
    return parts.join("")
}

// --- wiring ---

function loadDistributions() {
    if (distributions === null) {
        distributions = fetch("./data/distributions.json").then(response => response.json())
    }
    return distributions
}

// mark is the student's raw mark out of 100, or null when they have not converted yet
function updateCurve(mark) {
    const index = subject.value

    Promise.all([loadDistributions(), loadTable(index)]).then(([dist, table]) => {
        // a stale response from a subject the user has already switched away from
        if (subject.value !== index) return

        const info = dist.subjects[index]
        const starts = levelStarts(table)
        const grades = []
        for (let level = 1; level <= 7; level++) grades.push(info.grades[level])

        const fit = fitBellCurve(gradeBarriers(starts), grades)
        const clamped = Number.isFinite(mark) ? Math.min(100, Math.max(0, mark)) : null

        curveTitle.innerHTML = "Grade Distribution - " + subjects[index]
        curvePlot.innerHTML = buildSVG(fit, starts, clamped)
        curveSection.setAttribute("aria-label", "Bell curve of raw marks for " + subjects[index])

        if (clamped === null) {
            curvePercentile.innerHTML = `<span class="curve-muted">Convert a mark to see your percentile</span>`
            curveDetail.innerHTML = `Fitted to the ${info.candidates.toLocaleString()} candidates who sat ${info.ibName} in ${dist.session}.`
            return
        }

        const percentile = percentileOf(clamped, fit)
        const rounded = Math.min(99, Math.max(1, Math.round(percentile)))
        const beat = percentile >= 99.5 || percentile <= 0.5 ? percentile.toFixed(1) : String(Math.round(percentile))

        curvePercentile.innerHTML = `<span>${ordinal(rounded)}</span> percentile`
        curveDetail.innerHTML = `Estimated to be ahead of ${beat}% of the ${info.candidates.toLocaleString()} candidates who sat ${info.ibName} in ${dist.session}.`
    })
}
