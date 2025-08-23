
"use strict";

(async () => {

    const API_KEY = 'e7b875f92ac89b7f929a3cae5d2e73d837d39958d3c1b1b331440ce589bd0b10'
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

    const loadingSpinner = (id, displayStyle) => {
        const targetEl = document.getElementById(id)
        if (targetEl) targetEl.style.display = displayStyle
    }

    const showLoading = () => loadingSpinner("loading-spinner", "block")

    const hideLoading = () => loadingSpinner("loading-spinner", "none")


    let allCoins = [];

    const renderCoins = coins => {

        const favCoins = JSON.parse(localStorage.getItem(FAV_COINS_KEY) || "[]")

        const coinsHTML = coins.map(({name, symbol, priceUsd}) => {

            const isFav = favCoins.includes(name)
            return `
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">${symbol}</h5>
                            <div class="form-check form-switch">
                                <input class="form-check-input fav-toggle" type="checkbox" role="switch" id="fav-${name}" data-name="${name}" ${isFav ? "checked" : ""}>
                                <label class="form-check-label" for="fav-${name}"></label>
                            </div>
                    </div>
                    <p class="card-text text-muted">${name}</p>
                    <button class="btn btn-primary more-info-btn" data-toggle="tooltip" data-placement="top" title="Exchange Rate Tooltip" data-exchange-rate="${priceUsd}">More Info</button>
                </div>
            </div>
        `
        }).join(``)

        document.getElementById("coins-grid").innerHTML = coinsHTML

        document.querySelectorAll(".fav-toggle").forEach(toggle => {
        toggle.addEventListener(`change`, () => {
            const coinName = toggle.dataset.name
            const favCoins = JSON.parse(localStorage.getItem(FAV_COINS_KEY) || "[]")

            if (toggle.checked) {
                if (favCoins.length >= 5) {
                    toggle.checked = false
                    show5CoinsLimitationModal(coinName)
                    return
                }
            }

            toggleCoin(coinName)
        })
    })

    const showTooltip = (element, message, duration = 5000) => {
        element.setAttribute("title", message)
        const newTooltipInstance = new bootstrap.Tooltip(element)
        newTooltipInstance.show()

        setTimeout(() => {
            newTooltipInstance.dispose()
            element.dataset.activeTooltip = "false"
        }, duration)
    }

        document.querySelectorAll(".more-info-btn").forEach(tooltip => {

            tooltip.dataset.activeTooltip = "false"

            tooltip.addEventListener(`click`, async () => {

                try {

                const usdRate = parseFloat(tooltip.dataset.exchangeRate)
                
                const { conversion_rates: { EUR, ILS } } = await fetch(`https://v6.exchangerate-api.com/v6/9e397f3742bcda220e43f433/latest/USD`).then(resp => resp.json())

                const usdToEur = (usdRate * EUR).toFixed(2)
                const usdToIls = (usdRate * ILS).toFixed(2)

                console.log(`${usdToEur}€`)
                console.log(`${usdToIls}₪`)

                const isActive = tooltip.dataset.activeTooltip === "true"

                const exchangeUsdToIlsAndEur = `$${(usdRate).toFixed(2)} 🇺🇸 | ${usdToEur}€ 🇪🇺 | ${usdToIls}₪ 🇮🇱`

                tooltip.setAttribute("title", exchangeUsdToIlsAndEur)

                const tooltipInstance = bootstrap.Tooltip.getInstance(tooltip)

                if (isActive) {
                    tooltipInstance.dispose()
                    tooltip.dataset.activeTooltip = "false"
                } else {
                    showTooltip(tooltip, exchangeUsdToIlsAndEur)
                    tooltip.dataset.activeTooltip = "true"
                }

                } catch (err) {
                    console.log(err)
                    alert(`An error occurred while fetching exchange rates. Please try again later`)
                    showTooltip(tooltip, `Unable to load exchange rates. Please try again later`)

                    setTimeout(() => {
                        const errorTooltip = bootstrap.Tooltip.getInstance(tooltip)
                        if (errorTooltip) errorTooltip.dispose()
                    }, 5000)
                }

            })
        })
    }

    const loadCoins =  async () => {
        try {
            showLoading()
        const resp = await getData("https://rest.coincap.io/v3/assets?limit=102", API_KEY);
        const apiObj = typeof resp.data === "string" ? JSON.parse(resp.data) : resp
        return apiObj.data
        
        } catch (err) {
            console.error("Failed to load coins:", err);
            document.getElementById("coins-grid").innerHTML = `<p class="text-danger">Failed to load coins. Please try again later.</p>`
            return []
        } finally {
            hideLoading()
        }
    }

    const display102Coins = async () => {
        allCoins = await loadCoins()
        renderCoins(allCoins)
    }

    display102Coins()

    const searchContainer = document.getElementById("search-container")

    document.getElementById("pills-live-reports-tab").addEventListener("shown.bs.tab", () => {
    searchContainer.style.display = "none"
    })

    document.getElementById("pills-home-tab").addEventListener("shown.bs.tab", () => {
    searchContainer.style.display = "block"
    })

    document.getElementById("pills-about-tab").addEventListener("shown.bs.tab", () => {
    searchContainer.style.display = "none"
    })



    document.getElementById("search-input").addEventListener(`input`, async () => {
        
        const userCoin = document.getElementById("search-input").value.trim().toLowerCase()

        const filteredCoins = allCoins.filter(({name, symbol}) => 
            name.toLowerCase().includes(userCoin) || symbol.toLowerCase().includes(userCoin)
        )

        if (filteredCoins.length === 0) document.getElementById("coins-grid").innerHTML = `
        <div class="no-results">
            <h3>No coin was found 😢</h3>
        </div>
        `
        else renderCoins(filteredCoins)
        
    })


    const toggleCoin = coinName => {
        const favCoins = JSON.parse(localStorage.getItem(FAV_COINS_KEY) || "[]")
        const index = favCoins.indexOf(coinName)
        if (index === -1) {
            favCoins.push(coinName)
        }
        else {
            favCoins.splice(index, 1)
        }

        localStorage.setItem(FAV_COINS_KEY, JSON.stringify(favCoins))
    }

    const show5CoinsLimitationModal = newCoinName => {

        const favCoins = JSON.parse(localStorage.getItem(FAV_COINS_KEY) || "[]")
        
        document.getElementById("newCoinName").innerText = newCoinName

        const favHTML = favCoins.map(name => {
            const coin = allCoins.find(coin => coin.name === name)
            if (!coin) return ""
            const symbol = coin.symbol
            return `
                <div class="d-flex justify-content-center align-items-center mb-3 coin-row">
                    <span class="coin-name me-3">${symbol}</span>
                    <div class="form-check form-switch custom-switch">
                    <input class="form-check-input modal-fav-toggle" type="checkbox" role="switch"
                    data-old-name="${name}" data-new-name="${newCoinName}" checked>
                    </div>
                </div>
            `}).join(``)

        document.getElementById("favCoinsList").innerHTML = favHTML

        const modal = new bootstrap.Modal(document.getElementById("favLimitModal"));
        modal.show();
        
        setTimeout(() => {
            document.querySelectorAll(".modal-fav-toggle").forEach(toggle => {
                toggle.addEventListener(`change`, () => {
                    const oldCoin = toggle.dataset.oldName
                    const newCoin = toggle.dataset.newName

                    if(!toggle.checked) {
                        replaceCoin(oldCoin, newCoin);
                    }
                })
            })
        }, 500)
    }

    const replaceCoin = (oldCoin, newCoin) => {

        const favCoins = JSON.parse(localStorage.getItem(FAV_COINS_KEY) || "[]")

        const updatedFavs = favCoins.filter(name => name !== oldCoin)

        updatedFavs.push(newCoin)

        localStorage.setItem(FAV_COINS_KEY, JSON.stringify(updatedFavs))

        document.querySelector(".modal.show .btn-close").click()

        renderCoins(allCoins)
    }

    
    
    document.getElementById("pills-live-reports-tab").addEventListener("shown.bs.tab", () => {
        initLiveChart()
    })

    let liveChartInstance = null
    let liveSocket = null

    const initLiveChart = () => {
    const favCoins = JSON.parse(localStorage.getItem("favCoins") || "[]")
    const symbolMap = {}
    const binanceSymbols = favCoins.map(name => {
        const coin = allCoins.find(c => c.name === name)
        if (!coin) return null
        const symbol = coin.symbol.toLowerCase() + "usdt"
        symbolMap[symbol] = name
        return symbol
    }).filter(Boolean)

    const stream = binanceSymbols.map(s => `${s}@trade`).join("/")
    const socketUrl = `wss://stream.binance.com:9443/stream?streams=${stream}`

    const ctx = document.getElementById("liveChart").getContext("2d")

    if (liveChartInstance) {
        liveChartInstance.destroy()
    }

    liveChartInstance = new Chart(ctx, {
        type: "line",
        data: {
        labels: [],
        datasets: favCoins.map(name => ({
            label: name,
            data: [],
            borderWidth: 2,
            fill: false,
            borderColor: getRandomColor()
        }))
        },
        options: {
        responsive: true,
        animation: false,
        scales: {
            x: { title: { display: true, text: "Time" } },
            y: { title: { display: true, text: "Price (USD)" } }
        }
        }
    })

    if (liveSocket) {
        liveSocket.close()
    }

    liveSocket = new WebSocket(socketUrl)

    liveSocket.onopen = () => console.log("Binance WebSocket connected")
    liveSocket.onerror = err => console.error("Binance WebSocket error", err)

    liveSocket.onmessage = event => {
        const msg = JSON.parse(event.data)
        const stream = msg.stream
        const price = parseFloat(msg.data.p)
        const timestamp = new Date().toLocaleTimeString()

        const symbol = stream.split("@")[0]
        const coinName = symbolMap[symbol]
        const dataset = liveChartInstance.data.datasets.find(ds => ds.label === coinName)

        if (dataset) {
        dataset.data.push({ x: timestamp, y: price })
        if (dataset.data.length > 20) dataset.data.shift()
        }

        liveChartInstance.update()
    }
    }

    const getRandomColor = () => {
    const r = Math.floor(Math.random() * 200)
    const g = Math.floor(Math.random() * 200)
    const b = Math.floor(Math.random() * 200)
    return `rgb(${r}, ${g}, ${b})`
    }




})()
