// JS поддержка для карточек
// Copyright (C) 2018-2023 Kirill Smelkov <kirr@navytux.spb.ru>
//
// This program is free software: you can Use, Study, Modify and Redistribute
// it under the terms of the GNU General Public License version 3, or (at your
// option) any later version, as published by the Free Software Foundation.
//
// You can also Link and Combine this program with other software covered by
// the terms of any of the Free Software licenses or any of the Open Source
// Initiative approved licenses and Convey the resulting work. Corresponding
// source of such a combination shall include the source code for all other
// software used.
//
// This program is distributed WITHOUT ANY WARRANTY; without even the implied
// warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
//
// See COPYING file for full licensing terms.

/*global window, document */
(function (window, document) {
    "use strict";

    // настройка viewport чтобы media-query работали нормально
    // https://developer.mozilla.org/en-US/docs/Mozilla/Mobile/Viewport_meta_tag
    document.head.insertAdjacentHTML('afterbegin', `
    <meta name="viewport" content="width=device-width, initial-scale=1">
    `)

    // автоматически добавляем необходимые css
    function injectCSS(url) {
        let link = document.createElement("link")
        link.setAttribute("rel", "stylesheet")
        link.setAttribute("type", "text/css")
        link.setAttribute("href", url)
        document.querySelector("head").appendChild(link)
    }

    // URL-prefix для файлов поддержки. Определяем по URL cards.js
    let myurl = document.currentScript.src // http://navytux.spb.ru/~yarava/cards/cards.js
    let cardsBase = myurl.substring(0, myurl.lastIndexOf("/"))      // http://navytux.spb.ru/~yarava/cards
    let yBase = cardsBase.substring(0, cardsBase.lastIndexOf("/"))  // http://navytux.spb.ru/~yarava

    injectCSS(`${cardsBase}/cards.css`)
    injectCSS("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css")

    // заголовок, авторство
    // TODO extract license from meta[name='license']
    let copyright = ""
    let copymeta = document.querySelector("meta[name='copyright'][content]")
    if (copymeta) {
        copyright = copymeta.content
        if (copyright == "ГОД ИМЯ АВТОРА") { // из 0template.html
            copyright = ""
        }

    }
    if (!copyright) {
        copyright = `<span style="background-color: red">КТО АВТОР? КОГДА СДЕЛАЛ?</span>`
    }

    let inject = `
    <nav>
        <input id="q" type="search" autofocus>
        <button id="play" type="button"><i class="fa fa-play"></i></button>
        <button id="randshow" type="button" class="pressed"><i class="fa fa-random"></i></button>
    </nav>

    <h1>${document.title}</h1>
    `
    if (copyright !== "---") {
        inject += `
        <footer class="copyright">
         <p>&copy; ${copyright}, &nbsp; <a href=http://jjirraff.blogspot.com/2018/12/blog-post.html>
           <img src="${yBase}/x-cc-by-sa.svg" alt="CC BY-SA"></a>
         </p>
        </footer>
        `
    }
    inject += `
    <div id="modalWindow" class="modal">
      <div id="bigCardModal" class="modal-content">
        <span class="close">&times;</span>
        <p id="bigCardText">ABCDEF</p>
        <img id="bigCardImg"/>
        <span id="slideno">123</span>
      </div>
    </div>
    `
    document.body.insertAdjacentHTML('afterbegin', inject)


    // i:... -> картинка
    function isImg(cardText) {
        return cardText.startsWith("i:")
    }
    function imgCardURL(cardText) {
        return "img/" + cardText.substring(2) + ".jpg"
    }
    function imgCardText(cardText) {
        return cardText.substring(2)
    }


    // исходный параграф с текстом для карточек
    let pcards = document.querySelector('.cards')

    // [] с текстом карточек
    let cardv = []
    for (let cardText of (pcards.textContent.match(/\S+/g) || [])) {
        cardText = cardText.replace(/_/g, " ") // zuò_qì_chē -> zuò qì chē
        cardv.push(cardText)
    }


    // добавляем список с карточками и удаляем исходный параграф
    let cardList = document.createElement('ul')
    cardList.id = 'card-list'

    let n = 0
    for (let cardText of cardv) {
        let li = document.createElement('li')
        cardList.appendChild(li)
        li.className = "card"
        li.dataset.cardNumber = ++n

        //li.textContent = cardText

        let div  = document.createElement('div')
        li.appendChild(div)

        // i:... -> картинка
        if (isImg(cardText)) {
            let img = document.createElement('img')
            div.appendChild(img)
            img.className = "cardImg"
            img.src = imgCardURL(cardText)
            img.alt = imgCardText(cardText)
        // остальное -> текстовая карточка
        } else {
            let text = document.createElement('span')
            div.appendChild(text)
            text.className = "cardText"
            text.textContent = cardText
        }

        div.appendChild(document.createElement('br'))

        let cardNo = document.createElement('span')
        div.appendChild(cardNo)
        cardNo.className = "cardNumber"
        cardNo.textContent = n
    }

    document.body.replaceChild(cardList, pcards)

    // выбор карточек
    let cardsToPlay = []
    let cardsToPlayCurrent = undefined // индекс в ^^^
    let qinput = document.querySelector('#q')
    function updateCardsSelection() {
        // FIXME getNumbers не возвращает ошибку на плохом вводе (e.g. "1-10a")
        let q = qinput.value
        if (q === "") {
            q = "1-10000"    // XXX 1..∞
        }
        let qnot = false    // whether q starts with !
        if (q.startsWith("!")) {
            qnot = true
            q = q.substring(1)
        }
        let qset = new Set(getNumbers(q))
        cardsToPlay = []

        for (let li of cardList.children) {
            let cardNo = Number(li.dataset.cardNumber)
            let show = qset.has(cardNo)
            if (qnot) {
                show = !show
            }
            //console.log(li.dataset.cardNumber, show)
            if (show) {
                li.classList.remove("disabled")
                cardsToPlay.push(cardNo)
            } else {
                li.classList.add("disabled")
            }
        }

        bplay.disabled = (cardsToPlay.length === 0)
        cardsToPlayCurrent = (cardsToPlay.length === 0 ? undefined : -1) // next(-1) = 0
    }
    qinput.addEventListener('input', function (event) {
        //console.log("query:", qinput.value)
        //console.log("->", getNumbers(qinput.value))
        updateCardsSelection()
    })
    qinput.addEventListener('keyup', function (event) {
        // enter -> start show
        if (event.keyCode === 13) { // XXX -> symbol for Enter
            bplay.click()
        }
    })

    // play
    let modalWindow = document.querySelector('#modalWindow')
    let bigCardText = document.querySelector('#bigCardText')
    let bigCardImg  = document.querySelector('#bigCardImg')
    let bplay  = document.querySelector('#play')
    let xclose = document.querySelector('.close')
    let slideno = document.querySelector('#slideno')
    bplay.addEventListener('click', function(event) {
        modalWindow.style.display = "block";
        updateCardsSelection()
        if (randshow) {
            cardsToPlay = shuffle(cardsToPlay)
        }

        // unfocus everything, including "play" button, so that space works without restarting the play
        // FIXME не работает по нормальному
        //blurAll()
        //window.focus()
        //bigCardText.focus()
        //document.activeElement.blur()

        showNextBigCard(+1)
    })
    window.addEventListener('click', function(event) {
        if (event.target === bigCardModal) {
            let idxDelta = (event.clientX > bigCardModal.offsetWidth / 2 ? +1 : -1)
            showNextBigCard(idxDelta)
        }
    })

    /* XXX не работает по нормальному - либо одновременно нажимается и кнопка
     * "play", либо нет фокуса и не приходит event */
    window.addEventListener('keydown', function(event) {
        if (event.key === "Space") {
            showNextBigCard(+1)
        }
        // TODO "<-" -> showNextBigCard(-1)
    })

    function stopPlay() {
        modalWindow.style.display = "none";
    }
    xclose.addEventListener('click', function(event) {
        stopPlay()
    })


    function showNextBigCard(idxDelta) {
        cardsToPlayCurrent += idxDelta
        if (!(0 <= cardsToPlayCurrent && cardsToPlayCurrent < cardsToPlay.length)) {
            stopPlay()
            return
        }

        let cardText = cardv[cardsToPlay[cardsToPlayCurrent] - 1]
        if (isImg(cardText)) {
            bigCardImg.src = imgCardURL(cardText)
            bigCardImg .style.display = "block"
            bigCardText.style.display = "none"
        } else {
            bigCardText.textContent = cardText
            bigCardText.style.display = "block"
            bigCardImg .style.display = "none"
        }
        slideno.textContent = cardsToPlayCurrent + 1
    }


    // toggle random
    let randshow = true
    let brandom = document.querySelector('#randshow')
    brandom.addEventListener('click', function (event) {
        if (brandom.classList.contains("pressed")) {
            brandom.classList.remove("pressed")
            randshow = false
        } else {
            brandom.classList.add("pressed")
            randshow = true
        }
    })



    // ----------------------------------------
    // from https://codereview.stackexchange.com/a/26138 by "Joseph"
    // FIXME does not report error on bad input, e.g. "1-10a"
    let getNumbers = (function () {

        //we create a closure so as not to expose some of our utility functions

        function isNumber(n) {
            //we check isFinite first since it will weed out most of the non-numbers
            //like mixed numbers and strings, which parseFloat happily accepts
            return isFinite(n) && !isNaN(parseFloat(n));
        }

        //let's get this one out as well
        //the simple sort() wouldn't work so instead we provide a sorter
        function sorterFunction(a, b) {
            return a - b;
        }

        //getNumbers should be this function
        return function (stringNumbers) {

            //variable declaration format is personal preference
            //but I prefer having declarations with assignments have individual vars
            //while those that have no assignments as comma separated
            var i, range, low, high, entry;

            //an added bonus, " and ' are the same in JS, but order still applies
            //I prefer to use ' since it's cleaner
            var entries = stringNumbers.split(',');
            var length = entries.length;
            var nums = [];

            for (i = 0; i < length; ++i) {
                entry = entries[i];

                if (isNumber(entry)) {
                    //we check if the entry itself is a number. If it is, then we push it directly.
                    //an additinal advantage is that negative numbers are valid
                    nums.push(+entry);
                } else {

                    //if not a number, probably it had the - and not being a negative number
                    //only here do we split after we determined that the entry isn't a number
                    range = entry.split('-');

                    //check if what we split are both numbers, else skip
                    if (!isNumber(range[0]) || !isNumber(range[1])) continue;

                    //force both to be numbers
                    low = +range[0];
                    high = +range[1];

                    //since we are dealing with numbers, we could do an XOR swap
                    //which is a swap that doesn't need a third variable
                    //http://en.wikipedia.org/wiki/XOR_swap_algorithm
                    if (high < low) {
                        low = low ^ high;
                        high = low ^ high;
                        low = low ^ high;
                    }

                    //from low, we push up to high
                    while (low <= high) {
                        nums.push(low++);
                    }
                }
            }
            return nums.sort(sorterFunction);
        }
    }());


    // ----------------------------------------
    // from https://stackoverflow.com/a/2450976/9456786
    function shuffle(array) {
      var currentIndex = array.length, temporaryValue, randomIndex;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }

    // ----------------------------------------
    // from https://stackoverflow.com/a/29237391/9456786
    function blurAll(){
     var tmp = document.createElement("input");
     document.body.appendChild(tmp);
     tmp.focus();
     document.body.removeChild(tmp);
    }

}(window, document));
