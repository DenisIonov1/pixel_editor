import { lightClouds, darkClouds } from "./clouds.js";

const board = document.querySelector('.main-board');
const columnAmount = document.querySelector("#column-size");
const formBoardSize = document.querySelector(".parametrs")

const currentColor = document.querySelector("#color");
const eraser = document.querySelector('#eraser');
const cleanTool = document.querySelector('#clean');
const fillTool = document.querySelector('#fill');
const pen = document.querySelector('#pen');
const undoButton = document.querySelector("#undo");
const redoButton = document.querySelector("#redo");
const saveButton = document.querySelector("#save");

const saveModal = document.querySelector("#save-modal");
const saveFileButton = document.querySelector("#save-file");

const canselSaveButton = document.querySelector("#cansel-save");
const theme = document.querySelector(".theme");
const sky = document.querySelector(".sky");
const fileName = document.querySelector("#file-name");

let isDraw = false;
let fillModeOn = false;
let eraserOn = false;
let penActive = true;
let isDark = false;
let history = [];
let currentSmare = [];
let redoStack = [];

const createBoard = cellAmount => {
    board.innerHTML = '';
    for (let i = 0; i < cellAmount ** 2; i++) {
        let newDiv = document.createElement('div');
        newDiv.className = "cell";
        board.appendChild(newDiv);
    }
    board.style.gridTemplateColumns = `repeat(${cellAmount}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${cellAmount}, 1fr)`;
}
 
createBoard(10);

function fillField(startCell, targetColor) {
    const currentColor = getComputedStyle(startCell).backgroundColor;
    const newColorRgb = hexToRgb(targetColor);
    const changedCells = [];

    if (currentColor === newColorRgb) return;

    const queue = [startCell];
    const visited = new Set();
    visited.add(startCell);

    changedCells.push({
        cell: startCell,
        prevColor: currentColor,
        color: newColorRgb
    })

    while (queue.length > 0) {
        const current = queue.shift();
        current.style.backgroundColor = newColorRgb;

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (
                !visited.has(neighbor) &&
                getComputedStyle(neighbor).backgroundColor === currentColor
            ) {
                visited.add(neighbor);
                queue.push(neighbor);
                changedCells.push({
                    cell: neighbor, 
                    prevColor: getComputedStyle(neighbor).backgroundColor,
                    color: newColorRgb
                });
            }
        }
    }
    history.push(changedCells);
    redoStack = [];    
}

function getNeighbors(currentCell) {

    const cells = Array.from(document.querySelectorAll(".cell"));
    const size = Math.sqrt(cells.length);
    const index = cells.indexOf(currentCell);

    const row = Math.floor(index/size);
    const col = index % size;

    const neighbors = [];
    const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
            continue;
        }

        const neighborIndex = newRow * size + newCol;
        const neighbor = cells[neighborIndex];
        neighbors.push(neighbor);
    }
    return neighbors;
}

function deactivateTools(){
    pen.classList.remove("tool-active");
    eraser.classList.remove("tool-active");
    cleanTool.classList.remove("tool-active");
    fillTool.classList.remove("tool-active");
    undoButton.classList.remove("tool-active"); 
    redoButton.classList.remove("tool-active"); 
    saveButton.classList.remove("tool-active");

    
    eraserOn = false;
    fillModeOn = false;

}

function hexToRgb(hex) {
    hex = hex.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

cleanTool.addEventListener("click", () => {
    document.querySelectorAll(".cell").forEach(elem => {
        elem.style.backgroundColor = '';
    })
})

formBoardSize.addEventListener('submit', (event) => {
    event.preventDefault();
    let value = parseInt(columnAmount.value, 10);
    if (value <= 0 || isNaN(value)){
        return;
    }
    createBoard(value);
    columnAmount.value = "";
})

board.addEventListener("mousemove", event => {
    let target = event.target;
    let currentBc = getComputedStyle(target).backgroundColor;
    const newColor = eraserOn ? "#f0f8ff" : currentColor.value;
    const newColorRgb = eraserOn ? "rgb(240, 248, 255)" : hexToRgb(currentColor.value);

    if (!event.target.classList.contains("cell") || isDraw === false) return;

    if (currentBc !== newColorRgb) {
        currentSmare.push({cell: target, prevColor: currentBc, color: newColor})
    }
    
    if (eraserOn === true) {
        target.style.backgroundColor = "#f0f8ff"
    } else if (penActive){
        target.style.backgroundColor = newColor;
    }
})

board.addEventListener('click', event => {
    let target = event.target;
    if (!event.target.classList.contains("cell")) 
        return;
    if (fillModeOn === true) {
        fillField(target, currentColor.value)
    }

    const prevColor = getComputedStyle(target).backgroundColor;
    const newColor = eraserOn ? "#f0f8ff" : currentColor.value;
    const newColorRgb = eraserOn ? "rgb(240, 248, 255)" : hexToRgb(newColor);

    if (prevColor === newColorRgb) return;
    history.push([{
            cell: target, prevColor: getComputedStyle(target).backgroundColor, color: newColor}]);
    redoStack = [];

    if (eraserOn) {
        target.style.backgroundColor = "#f0f8ff"}
    else if (penActive){
        target.style.backgroundColor = currentColor.value}
})

board.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains("cell"))
    isDraw = true;  

    currentSmare = [];
})

document.addEventListener('mouseup', () => {
    isDraw = false;

    if (currentSmare.length > 0) {
        history.push(currentSmare);
        currentSmare = [];
        redoStack = [];
    }
})

eraser.addEventListener('click', () => {
    deactivateTools();
    eraserOn = true;
    eraser.classList.add("tool-active");
})

pen.addEventListener('click', () => {
    deactivateTools();
    penActive = true;
    pen.classList.add("tool-active");
})

fillTool.addEventListener('click', () => {
    deactivateTools();
    fillModeOn = true;
    fillTool.classList.add("tool-active");
})

undoButton.addEventListener('click', () => {
    deactivateTools();
    if (history.length == 0) return

    const lastAction = history.pop();
    
    redoStack.push(lastAction);
    
    lastAction.forEach(action => {
        action.cell.style.backgroundColor = action.prevColor;
    })
})

redoButton.addEventListener("click", () => {
    deactivateTools();
    if (redoStack.length === 0) return;
    let lastAction = redoStack.pop();
    for (let elem of lastAction) {
        elem.cell.style.backgroundColor = elem.color;
    }
    history.push(lastAction);
})

saveButton.addEventListener("click", () => {
    deactivateTools();
    saveModal.classList.add("active");    
})

saveFileButton.addEventListener("click", () => {
        const value = fileName.value; 

        if (value.trim() === "") {
            fileName.classList.add("active");
            fileName.focus();
            return
        }

        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;

        let context = canvas.getContext("2d");
        let cells = Array.from(document.querySelectorAll(".cell"));
        let size = Math.sqrt(cells.length);
        let pixelSize = 600 / size;
        let x = 0;
        let y = 0;
        
        for(let cell of cells) {
            let index = cells.indexOf(cell);
            let row = Math.floor(index / size);
            let col = index % size;
            let color = getComputedStyle(cell).backgroundColor;
            let x = col * pixelSize;
            let y = row * pixelSize;
            context.fillStyle = color;
            context.fillRect(x, y, pixelSize, pixelSize);
            
        }
        const pngDataURL = canvas.toDataURL("image/png");
        console.log(pngDataURL)
        const link = document.createElement("a");
        document.body.appendChild(link);
        link.href = pngDataURL;
        link.download = fileName.value;
        link.click();
        saveModal.classList.remove("active");
        fileName.value = "";
        }
)
        
canselSaveButton.addEventListener("click", () => {
            saveModal.classList.remove("active");
            fileName.value = "";
            fileName.classList.remove("active");
        }
)

fileName.addEventListener("input", () => {
    fileName.classList.remove("active");
})

function renderClouds(isDark) {
    const cloudList = isDark ? darkClouds : lightClouds;

    sky.innerHTML = "";
    cloudList.forEach((cloud, index) => {
    let cloudImg = document.createElement("img");
    cloudImg.src = `./img/${cloud}`;
    cloudImg.className=`cloud cloud-${index+1}`;
    sky.appendChild(cloudImg);
    console.log(cloud, "light");
})
}

renderClouds(isDark)

theme.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    isDark = !isDark;
    renderClouds(isDark);
})