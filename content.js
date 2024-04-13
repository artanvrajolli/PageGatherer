chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  const { message } = request;
  switch(message) {
    case "get_links":
    case "getLinks":
      getLinks(request, sender, sendResponse);
      break;
    case "get_images":
    case "getImages":
      getImages(request, sender, sendResponse);
      break;
    default:
      console.log("Unknown message", message);
  }
});




function getLinks(request, sender, sendResponse){
  let listHref = [...document.querySelectorAll("a")].map(i=>i.href);
  sendResponse({message: "links", links: listHref});
}

function getImages(request, sender, sendResponse){

  let listImageNested = [...document.querySelectorAll("img")].map(i=>{
        let imageSrc = i.src;
        let dataSrc = i.getAttribute("data-src");
        let srcList = [];
        if(imageSrc) srcList.push(imageSrc);
        if(dataSrc) srcList.push(dataSrc);
        for(let src of srcList){
          if(src.startsWith("data:image")){
            let blob = b64toBlob(src.split(",")[1], src.split(",")[0].split(":")[1].split(";")[0]);
            src = URL.createObjectURL(blob);
          }else if(src.startsWith("blob:")){
            src = URL.createObjectURL(fetch(src).then(r=>r.blob())); 
          }
        }
        return  srcList;
  });

  let listImage = listImageNested.flat();

  sendResponse({message: "images", images: listImage});
}



// base64 to blob without mime type
function b64toBlob(b64Data, contentType='', sliceSize=512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

