const { app, dialog } = require('electron').remote
const fs = require('fs')

let currentFile = null

document.write('<h1 id="gb-h1">greybox <span id="gb-filename" contenteditable="true" title=""></span></h1><nav id="gb-nav"> <a href="#" id="gb-close">X</a></nav><section id="gb-outer-code" contenteditable="true"></section>')

function saveFile (filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    nameFile(filePath)
  }
  catch(e) { alert('Failed to save the file') }
}

function openFile (filePath) {
  fs.readFile(filePath,'utf-8', (err,content) => {
    if(err){
      alert('Failed to open the file')
      return
    }
    nameFile(filePath)
    document.getElementById("gb-outer-code").innerHTML = content
  })
}

function nameFile (filePath){
  currentFile = filePath
  currentFilename = currentFile.substring(currentFile.lastIndexOf('\\')+1)
  document.getElementById("gb-filename").title = currentFile
  document.getElementById("gb-filename").innerHTML = currentFilename
}

// Close button
document.getElementById("gb-close").addEventListener("click", function (e) {
   window.close()
})

// Clean pasted text
document.getElementById("gb-outer-code").addEventListener("paste", (e) => {
  let paste = (event.clipboardData || window.clipboardData).getData('text')
  const selection = window.getSelection()
  if (!selection.rangeCount) return false
  selection.deleteFromDocument()
  document.execCommand("InsertHTML", false, paste)
  e.preventDefault()
})

// Ctrl/Cmd+s to save file
document.addEventListener("keydown", function(e) {
  if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)  && e.keyCode === 83) {
    e.preventDefault()
    const content = document.getElementById("gb-outer-code").innerHTML
    if(currentFile !== null){
      saveFile(currentFile, content)
    } else {
      dialog.showSaveDialog(function(filePath){
        if(filePath !== 'undefined'){
          saveFile(filePath, content)
        } else {
          alert("Sorry, there was an error saving the file.")
        }
      })
    }
  }

  // Ctrl/Cmd+o to open file
  if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)  && e.keyCode === 79) {
    e.preventDefault()

    dialog.showOpenDialog({
        properties: ['openFile']
    }, function(filePath){
      if(filePath !== 'undefined'){
        filePath = filePath[0]
        openFile(filePath)
      } else {
        alert("Sorry, there was an error opening the file.")
      }
    });
  }
}, false);

// Win32 file opening
app.requestSingleInstanceLock()
app.on('second-instance',(e, argv, workingDirectory) => {
  if (process.platform == 'win32') {
    filePath = process.argv.slice(1)
  }
  if (win) {
    if (win.isMinimized()) win.restore()
        win.focus()
  }
})
if (shouldQuit) {
    app.quit()
}

// OSX file opening
app.on('open-url', function (e, url) {
  event.preventDefault()
  filePath = url
})

console.log(filePath)
if(filePath !== 'undefined'){
  console.log(filePath)
  openFile(filePath)
} else {
  alert("Sorry, there was an error opening the file.")
}
