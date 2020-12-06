let currencyData = [];
let currentDate;

// Fetch todays currencies and then initiate the application
fetch("https://api.exchangeratesapi.io/latest")
.then((response) => response.json())
.then((data) => {
    currencyData = data;
    currencyData.rates[currencyData.base] = 1;
    initiate();
})
.catch(function(error) {
    console.log(error)
});

// When the initial data is recieved fill the application with the initial data
function initiate () {
    // Set current date to the date in the response
    currentDate = parseDate(currencyData.date);

    // Initialize "from" and "to" select elements with currencies
    const fromSelect = document.getElementById("from");
    const toSelect = document.getElementById("to");
    let fromOption = document.createElement("option");
    let toOption = document.createElement("option");
    console.log(currencyData.rates);
    const currencies = [...Object.keys(currencyData.rates)].sort();
    currencies.forEach(currency =>
    {
        fromOption = document.createElement("option");
        fromOption.text = currency
        fromSelect.add(fromOption);
        toOption = document.createElement("option");
        toOption.text = currency
        toSelect.add(toOption);
    });

    // Initiate year select
    const yearSelect = document.getElementById("year");
    for (i = currentDate.year; i >= 2000; i--)
    {
        let option = document.createElement("option");
        option.text = i;
        yearSelect.add(option);
    }

    // Iniate month and day select
    adaptDates();

    // Set SEK and EUR to default selected options
    const curIx = currency => currencies.findIndex(c => c === currency);
    document.getElementById("from").options[Math.max(0, curIx("SEK"))].selected = "selected";
    document.getElementById("to").options[Math.max(0, curIx("EUR"))].selected = "selected";

    // Set the current date to the current date
    document.getElementById("year").options[0].selected = "selected";
    document.getElementById("month").options[currentDate.month - 1].selected = "selected";
    document.getElementById("day").options[currentDate.day - 1].selected = "selected";
}

// Fetch currency data for a given date and then update the conversion
function updateCurrencies()
{
    const date = getSelectedDate();
    fetchCurrencies(date.year+"-"+date.month+"-"+date.day);
}

// Fetch currencies using the exchangeratesapi.io
function fetchCurrencies(operation)
{
    fetch("https://api.exchangeratesapi.io/"+operation)
    .then((response) => response.json())
    .then((data) => {
        currencyData = data;
        currencyData.rates[currencyData.base] = 1;
        updateConversion("from");
    })
    .catch(function(error) {
        console.log(error)
    });
}

// Update the conversion calculation
function updateConversion(side)
{
    const fromOption = getSelectedOption("from");
    const toOption = getSelectedOption("to");
    const fromValue = currencyData.rates[fromOption];
    const toValue = currencyData.rates[toOption];
    let amount;
    let conversionAmount;

    // Update calculation
    if (side === "from")
    {
        amount = parseFloat(document.getElementById("fromAmount").value);
        conversionAmount = ((toValue / fromValue) * amount).toFixed(2);
        document.getElementById("toAmount").value = conversionAmount;
        console.log(conversionAmount)
        if (isNaN(amount) || conversionAmount === "NaN" || !checkInput("from"))
        {
            document.getElementById("toAmount").value = "";
        }
    }
    else if (side === "to")
    {
        amount = parseFloat(document.getElementById("toAmount").value);
        conversionAmount = ((fromValue / toValue) * amount).toFixed(2);
        document.getElementById("fromAmount").value = conversionAmount;
        if (isNaN(amount) || conversionAmount === "NaN"  || !checkInput("to"))
        {
            document.getElementById("fromAmount").value = "";
        }
    }

    // First reset error boxes
    document.getElementById("fromAmount").classList.remove("error");
    document.getElementById("toAmount").classList.remove("error");
    // Add error boxes if there are any errors
    if (!checkInput(side))
    {
        document.getElementById(side+"Amount").classList.add("error");
    } else if (side === "from" && !(document.getElementById("fromAmount").value === "") && conversionAmount === "NaN")
    {
        document.getElementById("toAmount").classList.add("error");
    } else if (side === "to" && !(document.getElementById("toAmount").value === "") && conversionAmount === "NaN")
    {
        document.getElementById("fromAmount").classList.add("error");
    }
}

// Check if input is a number with a single allowed decimal dot
function checkInput(side)
{
    const validInput = /^([0-9]*[\.]?[0-9]*)$/;
    if (validInput.test(document.getElementById(side+"Amount").value)) return true;
    return false;
}

// Adapt date selects and then get data for the selected date
function updateDates()
{
    // Adapt date selects to only allow real and passed dates
    adaptDates()

    // Get the currency data for the updated date
    updateCurrencies();
}

// Update the date selects so that only real and already passed dates can be selected
function adaptDates()
{
    let date = getSelectedDate();

    // If the selected year is the current year
    // adapt the select to only contain passed months
    let targetAmountOfMonths = 12;
    if (date.year === currentDate.year) targetAmountOfMonths = currentDate.month;
    adaptSelect(document.getElementById("month"), targetAmountOfMonths);

    // If the old selected month is larger than the current
    // largest selectable month then select the largest seLecatble month
    const numberOfMonths = document.getElementById("month").length;
    if (numberOfMonths < date.month) document.getElementById("month").options[numberOfMonths - 1].selected = "selected";

    date = getSelectedDate();

    // Adapt the selectable days to only contain legal days for the year and month selected
    let targetAmountOfDays = daysInMonth(date.year, date.month);
    if (date.year === currentDate.year && date.month === currentDate.month) targetAmountOfDays = currentDate.day;
    adaptSelect(document.getElementById("day"), targetAmountOfDays);

    // If the old selected day is larger than the current
    // largest selectable day then select the largest seLecatble day
    const numberOfDays = document.getElementById("day").length;
    if (numberOfDays < date.day) document.getElementById("day").options[numberOfDays - 1].selected = "selected";

    // Hide reset button if the selected date is the current date
    document.getElementById("reset").style.display = "block"
    if (date.year === currentDate.year && date.month === currentDate.month && date.day === currentDate.day)
    {
        document.getElementById("reset").style.display = "none";
    }
}

// Add or remove options in a select to meet a new targeted length
function adaptSelect(select, targetLength)
{
    // Add options in the select if there are too few options
    while (select.length < targetLength)
    {
        let option = document.createElement("option");
        option.text = select.length + 1;
        select.add(option);
    }
    // Remove options in the select if there are too many options
    while (select.length > targetLength)
    {
        select.remove(select.length - 1);
    }
}

// Get the selected option
function getSelectedOption(id)
{
    const element = document.getElementById(id);
    return element.options[element.selectedIndex].value;;
}

// Get the selected date
function getSelectedDate()
{
    // If any date select is uninitiated just return the current date
    if (document.getElementById("year").length === 0) return currentDate;
    if (document.getElementById("month").length === 0) return currentDate;
    if (document.getElementById("day").length === 0) return currentDate;

    // Get and return the selected date
    let date = {year:getSelectedOption("year"), month:getSelectedOption("month"), day:getSelectedOption("day")};
    if (date.month.length === 1) date.month = "0"+date.month;
    if (date.day.length === 1) date.day = "0"+date.day;
    return date;
}

// Reset selected date to current date
function reset()
{
    document.getElementById("year").options[0].selected = "selected";
    document.getElementById("month").options[currentDate.month - 1].selected = "selected";
    document.getElementById("day").options[currentDate.day - 1].selected = "selected";
    updateDates();
}

// turn a date of the form 2010-09-15 into an object
function parseDate(date)
{
    const year = date.slice(0, date.indexOf("-"));;
    const month = date.slice(date.indexOf("-") + 1, date.lastIndexOf("-"));
    const day = date.slice(date.lastIndexOf("-") + 1, date.length);
    return {year, month, day};
}

// Get the total number of days in a month for a given year
function daysInMonth(year, month)
{
    const days = monthDays[month] || 31;
    return typeof days === 'function' ? days(year) : days;
}

// Get the total number of days in a month for a given year
const monthDays = {
    "02": year => isLeapYear(year) ? 29 : 28,
    "04": 30, // March
    "06": 30, // June
    "09": 30, // September
    "11": 30  // November
};

// Check if the given year is a leap year
function isLeapYear(year)
{
    if (year % 4 === 0)
    {
        if (year % 100 === 0)
        {
            if (year % 400 === 0)
            {
                return true;
            }
            return false;
        }
        return true;
    }
    return false;
}
