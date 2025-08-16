
"use strict";

function showLoadingBar() {
  const el = document.getElementById("loading-bar");
  if (el) el.style.visibility = "visible";
}
function hideLoadingBar() {
  const el = document.getElementById("loading-bar");
  if (el) el.style.visibility = "hidden";
}


(async () => {

    const API_KEY = '82cb46b7b83a294dbd0b8f7c565353bfe2ba817f67c2e3ba39df54b6f7f412bd'
    const CACHE_AGE_IN_SECONDS = 30

    const getData = async (url, apiKey) => {
        let data = localStorage.getItem(url)
        if (data) {
            data = JSON.parse(data)
            const { createdAt } = data
            console.log(new Date(createdAt).getTime() + CACHE_AGE_IN_SECONDS * 1000)
            console.log(new Date())
            if ((new Date(createdAt).getTime() + CACHE_AGE_IN_SECONDS * 1000) > new Date().getTime()) {
                console.log('cache hit')
                return data
            }
        }
        data = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } }).then(response => response.json())
        localStorage.setItem(url, JSON.stringify({ data: JSON.stringify(data), createdAt: new Date() }))
        console.log('cache miss')
        console.log(data)
        return data
    }
    try {
        const tokens = await getData('https://rest.coincap.io/v3/assets', API_KEY)
        console.log(tokens)

    } catch (e) {
        console.log(e)
    }

    const display100Coins = async () => {

        const resp = await getData("https://rest.coincap.io/v3/assets?limit=102", API_KEY);

        const apiObj = typeof resp.data === "string" ? JSON.parse(resp.data) : resp
        const coins = apiObj.data

        const coinsHTML = coins.map(({name, symbol}) =>
            `
            <div class="card">
            <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">${symbol}</h5>
                <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" onchange="toggleCoin('${symbol}')">
                </div>
            </div>
            <p class="card-text text-muted">${name}</p>
            <button class="btn btn-primary" onclick="showInfo('${symbol}')">More Info</button>
            </div>
        </div>
        `).join(``)

        document.getElementById("coins-grid").innerHTML = coinsHTML
    }

    display100Coins()

})()
