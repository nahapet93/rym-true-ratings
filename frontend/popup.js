function saveOptions() {
    const isWeighted = document.getElementById('isWeighted').checked;

    chrome.storage.sync.set(
        {isWeighted: isWeighted}
    );
}

document.getElementById('isWeighted').addEventListener('change', saveOptions);

document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.sync.get(
        'isWeighted',
        function (value) {
            document.getElementById('isWeighted').checked = value.isWeighted;
        }
    );
});
