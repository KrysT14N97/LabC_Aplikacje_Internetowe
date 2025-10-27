
const map = L.map('map').setView([52.2297, 21.0122], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    // crossOrigin requested to help with leaflet-image in some hosts
    crossOrigin: true
}).addTo(map);


if (Notification && Notification.permission !== "granted") {
    Notification.requestPermission().catch(() => {});
}


document.getElementById('locateBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            L.marker([latitude, longitude]).addTo(map)
                .bindPopup("Twoja lokalizacja").openPopup();
            map.setView([latitude, longitude], 15);
            alert(`Twoja lokalizacja: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }, () => alert("Nie udało się pobrać lokalizacji."));
    } else {
        alert("Geolokalizacja nie jest wspierana przez tę przeglądarkę.");
    }
});


document.getElementById('downloadBtn').addEventListener('click', () => {

    leafletImage(map, function(err, canvas) {
        if (err) {
            alert("Błąd przy generowaniu obrazu mapy: " + err);
            return;
        }

        const mapCanvas = document.getElementById('mapCanvas');
        const ctx = mapCanvas.getContext('2d');
        ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);


        ctx.drawImage(canvas, 0, 0, mapCanvas.width, mapCanvas.height);


        generatePuzzle(mapCanvas);
    });
});


function generatePuzzle(sourceCanvas) {
    const board = document.getElementById('puzzle-board');
    board.innerHTML = '';
    const size = 100;
    const pieces = [];

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const piece = document.createElement('canvas');
            piece.width = size;
            piece.height = size;
            const ctx = piece.getContext('2d');


            ctx.drawImage(sourceCanvas, x * size, y * size, size, size, 0, 0, size, size);

            piece.classList.add('puzzle-piece');
            piece.dataset.correctX = x * size;
            piece.dataset.correctY = y * size;


            const maxOffset = 300; // 400 - 100
            piece.style.left = `${Math.floor(Math.random() * maxOffset)}px`;
            piece.style.top = `${Math.floor(Math.random() * maxOffset)}px`;

            makeDraggable(piece, board);

            board.appendChild(piece);
            pieces.push(piece);
        }
    }
}

function makeDraggable(piece, board) {
    piece.addEventListener('mousedown', onMouseDown);

    function onMouseDown(e) {
        e.preventDefault();
        const rect = board.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;

        const pieceRect = piece.getBoundingClientRect();
        const offsetX = startX - pieceRect.left;
        const offsetY = startY - pieceRect.top;

        piece.style.zIndex = 1000;
        piece.style.cursor = "grabbing";

        function onMouseMove(ev) {
            const posX = ev.clientX - rect.left - offsetX;
            const posY = ev.clientY - rect.top - offsetY;

            const boundedX = Math.max(0, Math.min(400 - piece.offsetWidth, posX));
            const boundedY = Math.max(0, Math.min(400 - piece.offsetHeight, posY));

            piece.style.left = `${Math.round(boundedX)}px`;
            piece.style.top = `${Math.round(boundedY)}px`;
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            piece.style.zIndex = '';
            piece.style.cursor = "grab";

            const correctX = parseInt(piece.dataset.correctX, 10);
            const correctY = parseInt(piece.dataset.correctY, 10);
            const left = parseInt(piece.style.left, 10);
            const top = parseInt(piece.style.top, 10);

            const SNAP_DISTANCE = 15;
            if (Math.abs(left - correctX) <= SNAP_DISTANCE && Math.abs(top - correctY) <= SNAP_DISTANCE) {
                piece.style.left = `${correctX}px`;
                piece.style.top = `${correctY}px`;
                piece.style.border = "2px solid limegreen";
                piece.style.boxShadow = "none";

                piece.removeEventListener('mousedown', onMouseDown);
            }

            checkCompletion();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
}


function checkCompletion() {
    const pieces = document.querySelectorAll('.puzzle-piece');
    if (pieces.length === 0) return;

    for (let piece of pieces) {
        const correctX = parseInt(piece.dataset.correctX, 10);
        const correctY = parseInt(piece.dataset.correctY, 10);
        const left = parseInt(piece.style.left || 0, 10);
        const top = parseInt(piece.style.top || 0, 10);

        if (Math.abs(left - correctX) > 5 || Math.abs(top - correctY) > 5) {
            return; // jeszcze nie gotowe
        }
    }

    if (Notification && Notification.permission === "granted") {
        new Notification(" Gratulacje! Ułożyłeś mapę!");
    } else {
        alert(" Gratulacje! Ułożyłeś mapę!");
    }
}
