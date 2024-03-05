const date = document.getElementById("date")

// set date in footer
d = new Date()
date.innerHTML = d.getFullYear()

// change right arrow to down if on mobile
if (matchMedia('only screen and (max-width: 900px)').matches) {
    icon.className = "fa-sharp fa-solid fa-arrow-down"
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
