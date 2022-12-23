import Editor from './Editor'
import Modal from './Modal'
import Options from './options'
import * as Icons from './icons'
import * as Buffer from './plugins/Buffer'
import * as Clipboard from './plugins/Clipboard'
import * as Blocks from './plugins/Block'
import * as Styles from './plugins/Style'
import * as Mentions from './plugins/mentions'
import * as Links from './plugins/links'
import * as Images from './plugins/images-OLD'
import * as Colours from './plugins/Colours'
import * as Actions from './plugins/actions-OLD'
import * as Comments from './plugins/Comments'
import * as Settings from './plugins/settings'


const ARTE = {
    Editor,
    Modal,
    Buffer,
    Clipboard,
    Blocks,
    Styles,
    Mentions,
    Links,
    Images,
    Colours,
    Actions,
    Comments,
    Settings,
    Icons,
    Options
}

// Define where the editor will appear
const target = document.getElementById('editor')

// Setup toolbar (groups)
const toolbar = [
    ['BLOCK.H1', 'BLOCK.H2', 'BLOCK.H3', 'BLOCK.P', 'BLOCK.BQ'],
    ['BLOCK.OL', 'BLOCK.UL'],
    ['STYLE.B', 'STYLE.I', 'STYLE.U', 'STYLE.FOREGROUND', 'STYLE.BACKGROUND', 'STYLE.CLEAR'],
    ['BUFFER.UNDO', 'BUFFER.REDO'],
    ['CUT', 'COPY', 'PASTE'],
    ['Mentions', 'Links', 'Images', 'Comments', 'Actions'],
    ['Settings']
]

// Setup Mentions plugin with list of people
ARTE.Mentions.setup(['David', 'William', 'Jenny', 'Sally', 'Sarah', 'Susan', 'Brian'])

const options = 'debug=true,defaultContent=sample.arte'


// Create editor and add to dom in target position
const editor = new ARTE.Editor(target, '', toolbar, options)

// Configure buttons
const buttons = document.getElementById('index-buttons')

if (buttons) {

    // Clear
    const clear = document.createElement('button')
    clear.innerHTML = `${ARTE.Icons.clear} New`
    clear.addEventListener('click', () => editor.clear())
    buttons.appendChild(clear)

    // Upload
    const upload = document.createElement('button')
    upload.innerHTML = `${ARTE.Icons.fileOpen} Open`
    upload.addEventListener('click', () => editor.upload())
    buttons.appendChild(upload)
}

// Configure preview button
const preview = document.createElement('button')
preview.innerHTML = `${ARTE.Icons.preview} Preview`
preview.addEventListener('click', () => {
    // Get the preview from the editor
    let xml = editor.preview()
    // Insert line feed before all opening tags to make easier to read
    // xml = xml.replace(/(<[^\/.]+?>)/gm, '\n$1')
    // Instantiate the modal
    const drawer = new ARTE.Modal({
        type: 'full-screen',
        title: 'Cleaned XML to be saved',
        html: `<textarea style="height:100%;width:100%;padding:2rem;" readonly>${xml}</textarea>`,
        buttons: { cancel: { label: 'Close' } },
        escape: true
    })
    // Display the modal
    drawer.show()
})
buttons.appendChild(preview)

// Download
const download = document.createElement('button')
download.innerHTML = `${ARTE.Icons.download} Save`
download.addEventListener('click', () => editor.download())
buttons.appendChild(download)

