import Editor from './Editor'

// Setup toolbar (groups)
const toolbar = [
    ['FILE'],
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
    debug: false,
    defaultContent: 'sample.arte',
    people: ['David', 'William', 'Jenny', 'Sally', 'Sarah', 'Susan', 'Brian']
}

// Define where the editor will appear and buttons will appear
const editors = document.querySelectorAll('.arte-editor')

if (editors) {
    editors.forEach((target: Element) => initialise(target))
} else {
    alert('Could not find the target element for any editors. There needs to be at least one div with the class set to "arte-editor".')
}


// Create editor, adding to dom in target position
function initialise(target: Element) {
    new Editor(<HTMLElement>target, '', toolbar, options)
}