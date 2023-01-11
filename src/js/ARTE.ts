import Editor from './Editor'
import { Modal, ModalButton, ModalButtonAction, ModalType } from './Modal'
import * as Icons from './icons'


// Define where the editor will appear and buttons will appear
const target = document.getElementById('editor')
let editor: Editor

if (!target) {

    alert('Could not find the target element for the editor. There needs to be a div with the id set to "editor".')

} else {

    // Setup toolbar (groups)
    const toolbar = [
        ['BLOCK.H1', 'BLOCK.H2', 'BLOCK.H3', 'BLOCK.P', 'BLOCK.BLOCKQUOTE'],
        ['BLOCK.OL', 'BLOCK.UL'],
        ['STYLE.B', 'STYLE.I', 'STYLE.U', 'COLOUR.FOREGROUND', 'COLOUR.BACKGROUND', 'STYLE.CLEAR'],
        ['BUFFER.10'],
        ['CLIPBOARD.CUT', 'CLIPBOARD.COPY', 'CLIPBOARD.PASTE'],
        ['MENTIONS', 'CUSTOM-BLOCK.LINK', 'CUSTOM-BLOCK.IMAGE', 'CUSTOM-BLOCK.COMMENT', 'CUSTOM-BLOCK.ACTION'],
        ['SETTINGS']
    ]

    // Define options
    const options = {
        debug: true,
        defaultContent: 'sample.arte',
        people: ['David', 'William', 'Jenny', 'Sally', 'Sarah', 'Susan', 'Brian']
    }

    // Create editor, adding to dom in target position
    editor = new Editor(target, '', toolbar, options)

    // Application specific buttons for demo
    addDemoButtons()
}


function addDemoButtons() {
    const buttons = document.getElementById('index-buttons')
    if (buttons) {

        // Clear
        const clear = document.createElement('button')
        clear.innerHTML = `${Icons.clear} New`
        clear.addEventListener('click', () => editor.clear())
        buttons.appendChild(clear)

        // Upload
        const upload = document.createElement('button')
        upload.innerHTML = `${Icons.fileOpen} Open`
        upload.addEventListener('click', () => editor.upload())
        buttons.appendChild(upload)

        // Configure preview button
        const preview = document.createElement('button')
        preview.innerHTML = `${Icons.preview} Preview`
        preview.addEventListener('click', () => {
            // Get the preview from the editor
            let xml = editor.preview()
            // Insert line feed before all opening tags to make easier to read
            // xml = xml.replace(/(<[^\/.]+?>)/gm, '\n$1')
            // Instantiate the modal
            const buttons = [new ModalButton(ModalButtonAction.Cancel, 'Cancel')]
            const html = `<textarea style="height:100%;width:100%;padding:2rem;" readonly>${xml}</textarea>`
            const options = {
                type: ModalType.FullScreen,
                escapeToCancel: true,
            }
            new Modal('Cleaned XML to be saved', html, buttons, options)
        })

        buttons.appendChild(preview)

        // Download
        const download = document.createElement('button')
        download.innerHTML = `${Icons.download} Save`
        download.addEventListener('click', () => editor.download())
        buttons.appendChild(download)
    }
}
