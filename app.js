
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

            const isFav = favCoins.includes(symbol)
            return `
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">${symbol}</h5>
                            <div class="form-check form-switch">
                                <input class="form-check-input fav-toggle" type="checkbox" role="switch" data-symbol="${symbol}" ${isFav ? "checked" : ""}>
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
            const coinSymbol = toggle.dataset.symbol
            const favCoins = JSON.parse(localStorage.getItem(FAV_COINS_KEY) || "[]")

            if (toggle.checked) {
                if (favCoins.length >= 5) {
                    toggle.checked = false
                    show5CoinsLimitationModal(coinSymbol)
                    return
                }
            }

            toggleCoin(coinSymbol)
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
            console.error("❌ Failed to load coins:", err);
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


    const toggleCoin = coinSymbol => {
        const favCoins = JSON.parse(localStorage.getItem(FAV_COINS_KEY) || "[]")
        const index = favCoins.indexOf(coinSymbol)
        if (index === -1) {
            favCoins.push(coinSymbol)
        }
        else {
            favCoins.splice(index, 1)
        }

        localStorage.setItem(FAV_COINS_KEY, JSON.stringify(favCoins))
    }

    const show5CoinsLimitationModal = newCoinSymbol => {

        const favCoins = JSON.parse(localStorage.getItem(FAV_COINS_KEY) || "[]")
        
        document.getElementById("newCoinName").innerText = newCoinSymbol

        const favHTML = favCoins.map(symbol => `
            <div class="d-flex justify-content-center align-items-center mb-3 coin-row">
                <span class="coin-name me-3">${symbol}</span>
                <div class="form-check form-switch custom-switch">
                <input class="form-check-input modal-fav-toggle" type="checkbox" role="switch"
                    data-old-symbol="${symbol}" data-new-symbol="${newCoinSymbol}" checked>
                </div>
            </div>
            `).join(``)

        document.getElementById("favCoinsList").innerHTML = favHTML

        const modal = new bootstrap.Modal(document.getElementById("favLimitModal"));
        modal.show();
        
        setTimeout(() => {
            document.querySelectorAll(".modal-fav-toggle").forEach(toggle => {
                toggle.addEventListener(`change`, () => {
                    const oldCoin = toggle.dataset.oldSymbol;
                    const newCoin = toggle.dataset.newSymbol;

                    if(!toggle.checked) {
                        replaceCoin(oldCoin, newCoin);
                    }
                })
            })
        }, 500)
    }

    const replaceCoin = (oldCoin, newCoin) => {

        const favCoins = JSON.parse(localStorage.getItem(FAV_COINS_KEY) || "[]")

        const updatedFavs = favCoins.filter(symbol => symbol !== oldCoin)

        updatedFavs.push(newCoin)

        localStorage.setItem(FAV_COINS_KEY, JSON.stringify(updatedFavs))

        document.querySelector(".modal.show .btn-close").click()

        renderCoins(allCoins)
    }
})()
