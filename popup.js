const btnExtractLinks = document.getElementById("extract-links");
const btnExtractImages = document.getElementById("extract-images");
const popupList = document.getElementById("popup-list");
const popupContainer = document.getElementById("popup-container");

// start line global variables
const dd = console.log;
var result = {
    type: null,
    data: [],
    filtered: []
}
// end line global variables

// start line event listener
btnExtractLinks.addEventListener("click", function () {
    getLinks();
});

btnExtractImages.addEventListener("click", function () {
    getImages();
});


window.addEventListener("load", function () {
    console.log("popup.js loaded");
});
targetId("results-search").addEventListener("input", function () {
    let search = targetId("results-search")?.value ?? "";
    let data = result.data;
    let filtered = data.filter(i => {
        console.log(`i: ${i} search: ${search} i.includes(search): ${i.includes(search)}`);
        return i.includes(search.toLowerCase())
    });
    result.filtered = filtered;
    if (result.type === "links") {
        showListLinks();
    }
});

targetId("results-copy").addEventListener("click", function (e) {
    let { type, filtered } = result;
    let text = "";
    if (type === "links") {
        if (e.ctrlKey) {
            text = JSON.stringify(filtered);
        } else {
            text = filtered.join("\r\n");
        }
    }
    navigator.clipboard.writeText(text);
    targetId("results-copy").setAttribute("data-success", "Copied!");
    setTimeout(() => {
        targetId("results-copy").removeAttribute("data-success");
    }, 2500);
});
// end line event listener

function popupListClear() {
    while (popupList.firstChild) {
        popupList.removeChild(popupList.firstChild);
    }
}

function containerList({ results = "N/A", copy = false, search = false }) {
    popupContainer.querySelectorAll("[id]").forEach(i => i.setAttribute("hidden", ""));
    popupContainer.removeAttribute("hidden");
    popupList.removeAttribute("hidden");

    targetId("results-count").removeAttribute("hidden");
    targetId("results-count").innerHTML = results;
    copy && targetId("results-copy").removeAttribute("hidden");
    if (search) {
        targetId("results-search").removeAttribute("hidden");
        // targetId("results-search").value = "";
        targetId("results-search-container").removeAttribute("hidden");
        targetId("results-search").focus();
    }
}

// start line get links

function getLinks() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // get active tab
        let activeTab = tabs[0];
        let { id: tabId } = activeTab;
        // send message to content.js
        chrome.tabs.sendMessage(tabId, { message: "get_links" }, function (response) {
            // get response
            let { links } = response ?? { links: [] };
            // filter empty links
            links = links.filter(i => i !== "");
            // filter duplicate links
            links = [...new Set(links)];
            // show list of links
            result = {
                type: "links",
                data: links,
                filtered: links,
            }
            showListLinks();
        });
    });
}

function showListLinks() {
    if (result.type !== "links") throw new Error("showListLinks called for type:", result.type);
    // clear list
    popupListClear();
    containerList({
        results: result.filtered.length.toLocaleString(),
        copy: true,
        search: true
    });
    // add links to list
    result.filtered.forEach(link => {
        let li = document.createElement("li");
        li.classList.add('words-overflow');
        li.classList.add('row-li');
        li.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
        popupList.appendChild(li);
    });
}
// end line get links


// start line get images
function getImages() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // get active tab
        let activeTab = tabs[0];
        let { id: tabId } = activeTab;
        // send message to content.js
        chrome.tabs.sendMessage(tabId, { message: "get_images" }, function (response) {
            // get response
            let { images } = response ?? { images: [] };
            // filter empty links
            images = images.filter(i => i !== "");
            // filter duplicate links
            images = [...new Set(images)];
            // show list of images
            result = {
                type: "images",
                data: images,
                filtered: images
            }
            showListImages();
        });
    });
}



function showListImages() {
    if (result.type !== "images") throw new Error("showListImages called for type:", result.type);
    // clear list
    popupListClear();

    containerList({
        results: result.filtered.length.toLocaleString(),
        copy: false
    });
    // add images to list
    result.filtered.forEach(image => {
        let li = document.createElement("li");
        li.classList.add('text-center');
        li.classList.add('row-li');
        // li.innerHTML = `<a href="${image}" target="_blank"><img src="${image}" /></a>`;
        let anchor = document.createElement("a");
        anchor.classList.add("anchor-information");
        anchor.setAttribute("href", image);
        anchor.setAttribute("target", "_blank");
        anchor.addEventListener("click", function (e) {
            if (e.ctrlKey) {
                e.preventDefault();
                // download the image 
                let a = document.createElement("a");
                a.setAttribute("href", image);
                let filename = image.split("/").pop() ?? new Date().getTime().toString();
                if (filename.length > 25) {
                    filename = new Date().getTime().toString();
                }
                // check if file has extension of image else add .jpg
                if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
                    filename += ".jpg";
                }
                a.setAttribute("download", filename);
                a.click();
                a.remove();
            }
            if (e.shiftKey) {
                e.preventDefault();
                navigator.clipboard.writeText(image);
            }
        });
        let img = document.createElement("img");
        img.setAttribute("src", image);
        img.setAttribute("loading", "lazy");
        img.crossOrigin = "anonymous";
        img.addEventListener("load", function () {
            onLoadImageGetDimensions(img);
        });
        anchor.appendChild(img);
        li.appendChild(anchor);
        popupList.appendChild(li);
    });
}
// end line get images

function onLoadImageGetDimensions(ethis) {
    let width = ethis.naturalWidth ?? ethis.width ?? -1;
    let height = ethis.naturalHeight ?? ethis.height ?? -1;
    let parent = ethis.closest("a[href]");
    parent.setAttribute("data-dimensions", `${width}x${height}`);
}

// start line utils 
function targetId(id) {
    return document.getElementById(id);
}
// end line utils