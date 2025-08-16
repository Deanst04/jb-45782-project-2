
"use strict";

(async () => {

    const API_KEY = '068013e037a74c4f9c53f94038151b33b72ad7d10177faed42bb0cd879bfe8d3'
    const CACHE_AGE_IN_SECONDS = 30
    const FAV_COINS_KEY = "favCoins";

    const getData = async (url, apiKey) => {
        let data = localStorage.getItem(url)
        if (data) {
            data = JSON.parse(data)
            const { createdAt } = data
            console.log(new Date(createdAt).getTime() + CACHE_AGE_IN_SECONDS * 1000)
            console.log(new Date())
            if ((new Date(createdAt).getTime() + CACHE_AGE_IN_SECONDS * 1000) > new Date().getTime()) {
                console.log('cache hit')
                showLoading()
                await new Promise(resolve => setTimeout(resolve, 200)) // display loading spinner for 200 ms
                hideLoading()
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
        const tokens = await getData('https://rest.coincap.io/v3/assets?limit=102', API_KEY)
        console.log(tokens)

    } catch (e) {
        console.log(e)
    }

    const favCoins = []

    const loadingSpinner = (id, displayStyle) => {
        const targetEl = document.getElementById(id)
        if (targetEl) targetEl.style.display = displayStyle
    }

    const showLoading = () => loadingSpinner("loading-spinner", "block")

    const hideLoading = () => loadingSpinner("loading-spinner", "none")


    
    const display100Coins = async () => {

        try {
            showLoading()
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
        } catch (err) {
            console.error("❌ Failed to load coins:", err);
            document.getElementById("coins-grid").innerHTML = `<p class="text-danger">Failed to load coins. Please try again later.</p>`
        } finally {
            hideLoading()
        }

    }

    display100Coins()

    const toggleCoin = coinSymbol => {
        const favCoins = JSON.parse(localStorage.getItem(FAV_COINS_KEY) || "[]")
        const index = favCoins.indexOf(coinSymbol)
        if (index === -1) {
            favCoins.push(coinSymbol)
            localStorage.setItem(FAV_COINS_KEY, JSON.stringify(favCoins))
        }
        else {
            favCoins.splice(index, 1)
            localStorage.setItem(FAV_COINS_KEY, JSON.stringify(favCoins))
        }
    }
})()
