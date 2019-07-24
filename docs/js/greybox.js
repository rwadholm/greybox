const { app, dialog, electron, ipcMain } = require('electron').remote
const { ipcRenderer } = require('electron')
const fs = require('fs')

let currentFile = null
let filePath = null

document.write('<h1 id="gb-h1">greybox <span id="gb-filename" data-title="Filename"></span></h1><nav id="gb-nav"> <a href="#" id="gb-close">X</a></nav><section id="gb-outer-code" contenteditable="true"></section>')

function saveFile (filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    nameFile(filePath)
  }
  catch(e) { alert('Failed to save the file') }
}

function openFile (filePath) {
  fs.readFile(filePath,'utf-8', (err, content) => {
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
  if(currentFilename.length > 30) {
    currentFilename = currentFilename.substring(0,30) +"&hellip;";
  }
  document.getElementById("gb-filename").setAttribute("data-title", currentFile)
  document.getElementById("gb-filename").innerHTML = currentFilename
}

// Close button
document.getElementById("gb-close").addEventListener("click", (e) => {
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


document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd+s to save, Ctrl/Cmd+alt+s to "save as"
  if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode === 83) {
    e.preventDefault()
    const content = document.getElementById("gb-outer-code").innerHTML
    if(currentFile !== null && !e.altKey){
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
  if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode === 79) {
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
}, false)

if(ipcMain){
  ipcMain.on('get-file-data', (e, arg) => { // Win32 file opening
    let electron = require('electron');
    let app = electron.remote;
    let data = null
    if (app.process.platform == 'win32' && app.process.argv.length >= 2) {
      var openFilePath = app.process.argv[1]
      data = openFilePath
    }
    e.reply('get-file-data-reply', data)
  })
}
if(ipcRenderer){
  ipcRenderer.on('get-file-data-reply', (e, arg) => {
    if (arg === null) {
      alert("Sorry, there was an error opening the file.")
    } else {
      openFile(arg)
    }
  })
  ipcRenderer.send('get-file-data','file')

}

app.on('will-finish-launching', () => { // OSX file opening
  console.log('wfl: '+ process.argv)
  app.on('open-url', (e, filePath) => {
    e.preventDefault()
    if(filePath !== 'undefined' && filePath !== null){
      console.log(filePath)
      openFile(filePath)
    }
  })
})
