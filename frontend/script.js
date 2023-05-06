if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRatings);
} else {
    initRatings();
}

function initRatings() {
    chrome.storage.sync.get(
        'isWeighted',
        function (value) {
            const isWeighted = value && value.isWeighted ? value.isWeighted : false;
            setAlbumPageTrueRating(isWeighted);
            setArtistPageTrueRating(isWeighted);
        }
    );
}

async function setAlbumPageTrueRating(isWeighted = false) {
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
                [trueRating, ratingCount] = calculateTrueRating(isWeighted);
            }

            const serverData = await getRatingFromServer(albumId);
            trueRatingFromServer = serverData ? (isWeighted ? +serverData['weighted_avg_rating'] : +serverData['avg_rating']) : 0;
            ratingCountFromServer = serverData ? +serverData['rating_count'] : 0;

            if (trackAvgDiv) {
                if (trueRating !== trueRatingFromServer) {
                    await setRatingToServer(albumId, trueRating, ratingCount, isWeighted);
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

async function setArtistPageTrueRating(isWeighted = false) {
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

            if (serverData.some(function (releaseInfo) {
                return releaseInfo['release_id'] === id
                    && ((isWeighted && releaseInfo['weighted_avg_rating'])
                        || (!isWeighted && releaseInfo['avg_rating']));
            })) {
                const serverRating = serverData.find(releaseInfo => releaseInfo['release_id'] === id);
                const trueRating = isWeighted ? serverRating['weighted_avg_rating'] : serverRating['avg_rating'];
                changeArtistPageHtml(serverData, elem, trueRating);
            }
        });
    }
}

async function setRatingToServer(albumId, trueRating, ratingCount, isWeighted = false) {
    let rawResponse = {};
    const field = isWeighted ? 'weighted_avg_rating' : 'avg_rating';

    try {
        rawResponse = await fetch(`http://localhost:3000/release/${albumId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({trueRating, ratingCount, field})
        });
    } catch (error) {
        return rawResponse;
    }

    await rawResponse.json();
}

async function getRatingFromServer(albumId) {
    let response = {};
    try {
        response = await fetch(`http://localhost:3000/release/${albumId}`);
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
        response = await fetch(`http://localhost:3000/releases/${ids}`);
    } catch (error) {
        return response;
    }

    if (response.ok) {
        return await response.json();
    } else {
        console.log("HTTP error: " + response.status);
    }
}

function calculateTrueRating(isWeighted = false) {
    const songRatingLis = document.querySelectorAll('#tracks li');
    let ratingSum = 0;
    let ratingDurationSum = 0;
    let countSum = 0;
    let countDurationSum = 0;

    songRatingLis.forEach(ratingLi => {
        const trackRatingDiv = ratingLi.querySelector('.track_rating_avg');
        const durationDiv = ratingLi.querySelector('.tracklist_duration');

        if (trackRatingDiv && (!isWeighted || durationDiv)) {
            const arr = trackRatingDiv.getAttribute('data-tiptip').split(' ');
            const [rating, , count] = arr.map(parseFloat);
            const duration = durationDiv.getAttribute('data-inseconds');

            ratingSum += rating * count;
            ratingDurationSum += rating * count * duration;
            countSum += count;
            countDurationSum += count * duration;
        }
    });

    const avg = countSum === 0 ? 0 : (isWeighted ? ratingDurationSum / countDurationSum : ratingSum / countSum);
    return [+(avg.toFixed(2)), countSum];
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
