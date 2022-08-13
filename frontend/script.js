if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', afterDOMLoaded);
} else {
    afterDOMLoaded();
}

function afterDOMLoaded() {
    setAlbumPageTrueRating();
    setArtistPageTrueRating();
}

async function setAlbumPageTrueRating() {
    const shortcutElem = document.querySelector('.album_shortcut');

    if (shortcutElem) {
        const albumId = +shortcutElem.value.match(/\d+/)[0];
        let trueRatingFromServer, ratingCountFromServer;

        const avgSpan = document.querySelector('.avg_rating');
        const trackAvgDiv = document.querySelector('.track_rating_avg');

        if (avgSpan) {
            const ratingTr = avgSpan.closest('tr');
            const [fromStr, , ratingsStr] = ratingTr.querySelector('.num_ratings').innerText.split(' ');
            const rating = +avgSpan.innerText;
            let trueRating, ratingCount;

            if (trackAvgDiv) {
                [trueRating, ratingCount] = calculateTrueRating();
            }

            const serverData = await getRatingFromServer(albumId);
            trueRatingFromServer = serverData ? +serverData['avg_rating'] : 0;
            ratingCountFromServer = serverData ? +serverData['rating_count'] : 0;

            if (trackAvgDiv) {
                if (trueRating !== trueRatingFromServer) {
                    await setRatingToServer(albumId, trueRating, ratingCount);
                }
            } else {
                [trueRating, ratingCount] = [trueRatingFromServer, ratingCountFromServer]
            }

            if (ratingCount) {
                changeReleasePageHtml(trueRating, rating, ratingCount, fromStr, ratingsStr, ratingTr);
            }
        }
    }
}

async function setArtistPageTrueRating() {
    const releaseElems = document.querySelectorAll('.disco_release');

    if (releaseElems.length) {
        const ids = [];
        releaseElems.forEach(elem => {
            const id = elem.id.match(/\d+/)[0];
            ids.push(id);
        });

        const serverData = await getAllRatingsFromServer(ids);

        releaseElems.forEach(elem => {
            const id = +elem.id.match(/\d+/)[0];

            if (serverData.some(releaseInfo => releaseInfo['release_id'] === id)) {
                const trueRating = serverData.find(releaseInfo => releaseInfo['release_id'] === id)['avg_rating'];
                changeArtistPageHtml(serverData, elem, trueRating);
            }
        });
    }
}

async function setRatingToServer(albumId, trueRating, ratingCount) {
    let rawResponse = {};
    try {
        rawResponse = await fetch(`https://rym-true-ratings-backend.herokuapp.com/release/${albumId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({trueRating, ratingCount})
        });
    } catch (error) {
        return rawResponse;
    }

    await rawResponse.json();
}

async function getRatingFromServer(albumId) {
    let response = {};
    try {
        response = await fetch(`https://rym-true-ratings-backend.herokuapp.com/release/${albumId}`);
    } catch (error) {
        return response;
    }

    if (response.ok) {
        return await response.json();
    } else {
        console.log("HTTP error: " + response.status);
    }
}

async function getAllRatingsFromServer(ids) {
    let response = {};
    try {
        response = await fetch(`https://rym-true-ratings-backend.herokuapp.com/releases/${ids}`);
    } catch (error) {
        return response;
    }

    if (response.ok) {
        return await response.json();
    } else {
        console.log("HTTP error: " + response.status);
    }
}

function calculateTrueRating() {
    const songRatingLis = document.querySelectorAll('#tracks li');
    let ratingSum = 0;
    let countSum = 0;

    songRatingLis.forEach(ratingLi => {
        const trackRatingDiv = ratingLi.querySelector('.track_rating_avg');

        if (trackRatingDiv) {
            const arr = trackRatingDiv.getAttribute('data-tiptip').split(' ');
            const [rating, , count] = arr.map(parseFloat);

            ratingSum += rating * count;
            countSum += count;
        }
    });

    const avg = countSum === 0 ? 0 : +((ratingSum / countSum).toFixed(2));
    return [avg, countSum];
}

function changeReleasePageHtml(trueRating, rating, ratingCount, fromStr, ratingsStr, ratingTr) {
    const diff = (trueRating * 100 - rating * 100) / rating;
    const newTr = document.createElement('tr');
    newTr.innerHTML = `<th class="info_hdr">True RYM Rating</th><td colspan="2" style="padding:4px;">
                         <span>
                           <span class="avg_rating">
                              ${trueRating.toFixed(2)}
                           </span>
                           <span class="max_rating">/ <span>5.0</span><span style="display:none">0.5</span></span>
                           <span class="num_ratings">
                              ${fromStr} <b><span>${ratingCount.toLocaleString('en-US')}</span></b> ${ratingsStr}
                           </span> <span class="max_rating">( ${diff > 0 ? '+' : ''}${diff.toFixed(2)}% )</span>
                        </span>
                        </td>`;

    ratingTr.parentNode.insertBefore(newTr, ratingTr.nextSibling);
}

function changeArtistPageHtml(serverData, elem, trueRating) {
    const ratingDiv = elem.querySelector('.disco_avg_rating');
    const rating = +ratingDiv.innerText;

    const diff = (trueRating * 100 - rating * 100) / rating;

    const newDiv = document.createElement('div');
    newDiv.title = `${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`;
    newDiv.innerHTML = trueRating.toFixed(2);
    ratingDiv.style.lineHeight = '1.24em';
    ratingDiv.append(newDiv);
}
