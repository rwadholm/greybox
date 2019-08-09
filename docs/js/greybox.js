const { app, dialog, electron, ipcMain } = require('electron').remote
const { ipcRenderer } = require('electron')
const fs = require('fs')
const findInFiles = require('find-in-files')

let currentFile = null
let filePath = null

document.write('<h1 id="gb-h1">greybox <span id="gb-filename" data-title="Filename"></span></h1><div id="gb-finder"><label>Find:</label> <input type="text" name="gb-pattern" id="gb-pattern" placeholder="pattern" value="" /><br><label>Directory:</label> <input type="text" name="gb-directory" id="gb-directory" value="." /><br><label>Filetype:</label> <input type="text" name="gb-filetype" id="gb-filetype" value=".gxt$" /><br><input type="button" id="gb-findIt" value="Find" /> <a href="#" id="gb-closeFinder">Close</a><div id="gb-finderResults"></div></div><nav id="gb-nav"><a href="#" id="gb-close">X</a></nav><section id="gb-outer-code" contenteditable="plaintext-only"></section>')

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
      console.log('Failed to open the file')
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

function addFind(filePath = './') { // Add the find box
  currentFolder = '.'
  if(filePath){
    let currentFolder = filePath.split("/").slice(0,-1).join("/")
  }
  document.getElementById("gb-finder").style.display = "block"
  document.getElementById("gb-pattern").focus()
  document.getElementById("gb-directory").value = currentFolder
}

function removeFind() {
  document.getElementById('gb-finderResults').innerHTML = ''
  document.getElementById("gb-finder").style.display = "none"
}

function findIt(pattern, directory, ext){
  findInFiles.find({'term':pattern,'flags':'ig'},directory, ext).then(function(results) {
    console.log("find: "+ pattern, directory, ext)
    for (let result in results) {
      let res = results[result];
      let currentRes = document.createElement('p')
      currentRes.classList.add('gb-found')
      currentRes.innerHTML = `Found "${res.matches[0]}" ${res.count} times in <a href="#" class="gb-openFinderFile" onClick="openFile(this.textContent);removeFind();return false;">${result}</a>`
      document.getElementById('gb-finderResults').appendChild(currentRes)
    }
  })
}

// Find button
document.getElementById("gb-findIt").addEventListener("click", (e) => {
  let pattern = document.getElementById('gb-pattern').value
  let directory = document.getElementById('gb-directory').value
  let ext = document.getElementById('gb-filetype').value
  if(pattern !== '' && directory !== '' && ext !== ''){
    findIt(pattern, directory, ext)
  }
})

// Close find button
document.getElementById("gb-closeFinder").addEventListener("click", (e) => {
  e.preventDefault()
  removeFind()
})

// Close window button
document.getElementById("gb-close").addEventListener("click", (e) => {
   window.close()
})

// Clean pasted text
document.getElementById("gb-outer-code").addEventListener("paste", (e) => {
  let paste = (event.clipboardData || window.clipboardData).getData('text/html')
  const selection = window.getSelection()
  if (!selection.rangeCount) return false
  selection.deleteFromDocument()
  document.execCommand("InsertHTML", false, trim(paste))
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

  // Ctrl/Cmd+f to find text in file
  if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode === 70) {
    e.preventDefault()
    if(filePath.length > -1){
      addFind(filePath[0])
    } else {
      addFind('./')
    }
  }

  if (e.keyCode === 9) { // Tab key
    e.preventDefault()
    let selection = window.getSelection()
    if(!e.shiftKey){
      document.execCommand("InsertHTML", false, '  '+ selection)
    } else {
      document.execCommand("delete", false, null)
    }
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
    if (arg !== null) {
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
