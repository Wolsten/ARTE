import Editor from './Editor'
import Modal from './Modal'
import Options from './options'
import * as Icons from './icons'
import * as Buffer from './plugins/Buffer'
import * as Clipboard from './plugins/clipboard'
import * as Blocks from './plugins/Block'
import * as Styles from './plugins/Style'
import * as Mentions from './plugins/mentions'
import * as Links from './plugins/links'
import * as Images from './plugins/images'
import * as Colours from './plugins/colours'
import * as Actions from './plugins/actions'
import * as Comments from './plugins/comments'
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
    [ARTE.Blocks.H1, ARTE.Blocks.H2, ARTE.Blocks.H3, ARTE.Blocks.P, ARTE.Blocks.BQ],
    [ARTE.Blocks.OL, ARTE.Blocks.UL],
    [ARTE.Styles.B, ARTE.Styles.I, ARTE.Styles.U, ARTE.Colours.FOREGROUND, ARTE.Colours.BACKGROUND, ARTE.Styles.CLEAR],
    [ARTE.Buffer.UNDO, ARTE.Buffer.REDO],
    [ARTE.Clipboard.CUT, ARTE.Clipboard.COPY, ARTE.Clipboard.PASTE],
    [ARTE.Mentions.BUTTON, ARTE.Links.BUTTON, ARTE.Images.BUTTON, ARTE.Comments.BUTTON, ARTE.Actions.BUTTON],
    [ARTE.Settings.BUTTON]
]

// Setup Mentions plugin with list of people
ARTE.Mentions.setup(['David', 'William', 'Jenny', 'Sally', 'Sarah', 'Susan', 'Brian'])

// Define editor options
const options = new ARTE.Options()

// const options = {
//     // Automatically number headings using outline numbering. Allowed values true or false   
//     // If include the ARTE.Options.BUTTON in the toolbar then this value can be set by the user     
//     headingNumbers: true,
//     // Styling theme
//     // If include the ARTE.Options.BUTTON in the toolbar then this value can be set by the user   
//     theme: 'theme-light',
//     // Number of Undo operations supported, max 10
//     bufferSize: 10,
//     // Show explorer sidebar? (should be true for testing)
//     explorer: true,
//     // debugging flag, e.g. to output selection ranges
//     debug: true,
//     // Add default content from separate file
//     // The option will attempt to read in this file and 
//     // override any value for the initial content specified 
//     // by the second parameter when creating the editor instance
//     // @todo Comment out default content when running test scripts
//     defaultContent: 'sample.arte'
// }

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

