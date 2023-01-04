// import Modal from './Modal.js'
import EditRange from './EditRange.js'

// -----------------------------------------------------------------------------
// @section Arrays
// -----------------------------------------------------------------------------

/**
 * Tests whether two arrays are equal - neither can be empty
 * Returns true if neither empty and all values equal
 */
export const arraysEqual = function (a: [], b: []): boolean {
    if (a.length != 0 && b.length != 0 && a.length != b.length) {
        return false
    }
    return a.every((item, index) => b[index] == item)
}

/**
 * Check whether array item in a is also a member of b
 */
export const arraySubset = function (a: [], b: []): boolean {
    return a.every((item, index) => b[index] == item)
}


// -----------------------------------------------------------------------------
// @section Dom manipulation
// -----------------------------------------------------------------------------

// Common tags to be supported
// let tags = {
//     block: ['DIV', 'H1', 'H2', 'H3', 'P', 'LI', 'BLOCKQUOTE'],
//     list: ['LI'],
//     custom: <string[]>[]
// }
let tags = {
    block: ['DIV', 'LI'],
    list: ['LI'],
    custom: <string[]>[]
}


/**
 * Register a new button type with tag to allow future checking/cleaning
 */
export const registerTag = function (type: string, tag: string): void {
    if (tag === 'CLEAR') return
    switch (type) {
        case 'block':
            if (!tags.block.includes(tag)) tags.block.push(tag)
            return
        case 'list':
            if (!tags.list.includes(tag)) tags.list.push(tag)
            return
        case 'custom':
            if (!tags.custom.includes(tag)) tags.custom.push(tag)
    }
    return
}

/**
 * Debug function to print out the tags array
 */
export const debugTags = function () {
    console.log('blocks', tags.block.join(', '))
    console.log('lists', tags.list.join(', '))
    console.log('inline', tags.inline.join(', '))
    console.log('customs', tags.custom.join(', '))
}

/**
 * Insert newNode after existingNode
 * @param {HTMLElement} newNode 
 * @param {HTMLElement} existingNode 
 * @returns {HTMLElement} the new node inserted
 */
export const insertAfter = function (newNode, existingNode) {
    if (newNode == null || existingNode == null) {
        console.warn('Error.  Found when inserting a new node after an existing node')
    }
    return existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

/**
 * Insert newNode before existingNode
 * @param {HTMLElement} newNode 
 * @param {HTMLElement} existingNode 
 * @returns {HTMLElement} the new node inserted
 */
export const insertBefore = function (newNode, existingNode) {
    if (newNode == null || existingNode == null) {
        console.warn('Error.  Found when inserting a new node before an existing node')
    }
    return existingNode.parentNode.insertBefore(newNode, existingNode);
}

/**
 * 
 * @param {HTMLElement} existingNode 
 * @param {string} tag The html tag of the new node
 * @param {string} html The new innerHTML string to use for the replacement node
 * @returns 
 */
export const replaceNode = function (existingNode, tag, html) {
    if (existingNode == null || existingNode.parentNode == null) {
        console.warn('Error.  Found when replacing an existing node with a new node')
        console.warn({ existingNode })
        console.warn(existingNode.parentNode)
    }
    const replacementNode = document.createElement(tag)
    replacementNode.innerHTML = html
    const node = existingNode.parentNode.insertBefore(replacementNode, existingNode)
    existingNode.parentNode.removeChild(existingNode)
    return node
}

/**
 * Check whether the node is an inline style span
 * @param {HTMLElement} node 
 * @returns {boolean}
 */
export const isStyle = function (node) {
    if (node.nodeType != 1) {
        return false
    }
    return node.tagName === 'SPAN' || node.tagName === 'I'
}

/**
 * Check whether the node is a list container
 * @param {HTMLElement} node 
 * @returns {boolean}
 */
export const isList = function (node) {
    if (node.nodeType != 1) {
        return false
    }
    return node.tagName === 'OL' || node.tagName === 'UL'
}

/**
 * Check whether the node is a block container
 */
export const isBlock = function (node: Node | null) {
    if (!node || node.nodeType != 1) {
        return false
    }
    const result = tags.block.includes(node.nodeName)
    return result
}

/**
 * Checks whether the element is a custom element
 * @param {HTMLElement} node 
 * @returns {boolean}
 */
export const isCustom = function (node) {
    if (node.tagName == undefined) {
        return false
    }
    return tags.custom.includes(node.tagName)
    // return node.getAttribute('contenteditable') != null && 
    //        node.getAttribute('contenteditable') == "false"
}

/**
 * Return true if child is not the parent but contains the parent
 * @param {HTMLElement} parent 
 * @param {HTMLElement} child 
 * @returns {boolean}
 */
function contains(parent, child) {
    return parent !== child && parent.contains(child)
}

/**
 * Check whether the selected range is completely within a custom element
 * Cannot start a selection in a custom block and then select outside of it
 * so do not need to check the end range. Returns the custom element containing 
 * the range or false if not.
 */
const rangeStartContainerInCustom = function (range: EditRange): HTMLElement | false {
    if (!range) {
        console.warn('Error. Passed missing range when looking for a custom node')
    }
    let node = range.startContainer
    while (isCustom(node) === false && node.parentNode !== null && node.parentNode.nodeName !== 'DIV') {
        node = node.parentNode
    }
    return isCustom(node) ? <HTMLElement>node : false
}


export const selectionContainsCustoms = function (editorNode, selection) {
    const customs = editorNode.querySelectorAll('[contenteditable="false"]')
    let found = false
    for (let i = 0; i < customs.length && found == false; i++) {
        if (selection.containsNode(customs[i], true)) {
            found = true
        }
    }
    //console.warn({found})
    return found
}


/**
* Get the inline styles for all nodes in the tree from the lowest to the highest that
* isn;t a block node. In practice these are attached only to SPANs
* @param {HTMLElement} node 
* @returns {string} of styles separated by semi-colons
*/
export const getInlineStyles = function (node) {
    if (node == null) {
        console.warn('Found null node when getting inline styles')
    }
    let styles = ''
    while (isBlock(node) == false) {
        if (node.nodeType === 1) {
            const inlineStyles = node.getAttribute('style')
            if (inlineStyles != null && inlineStyles != '') {
                styles += ';' + inlineStyles
            }
        }
        if (node.parentNode == null) {
            console.warn('Error.  Found missing parent node when getting inline styles')
        }
        node = node.parentNode
    }
    return styles
}


/**
 * Get the parent block node or return the block if the node itself is a block
 * Returns  parent block node or false if error occurs
 */
export const getParentBlockNode = function (node: Node | null): Node | false {
    if (node == null) {
        console.warn('Error. Passed null node to getParentBlockNode')
        return false
    }
    // console.log('getParentBlockNode',node)
    // Keep going up the tree while the node is not a block node
    // (the editor is a block node - a DIV)
    while (isBlock(node) == false) {
        if (node.parentNode == null) {
            console.warn('Error. Found missing parent node when getting parent block node')
            return false
        }
        node = node.parentNode
        // console.log('node',node)
    }
    return node
}

/**
 * Get the parent editor node of a node
 * @param {HTMLElement} node 
 * @returns {HTMLElement} 
 */
export const getEditorNode = function (node) {
    while (node.getAttribute('contenteditable') !== "true") {
        if (node.parentNode == null) {
            console.warn('Error.  Found missing parent node when getting editor node')
        }
        node = node.parentNode
    }
    return node
}

/**
 * Get the top parent node for a child node 
 * @param {HTMLElement} node A child node
 * @param {HTMLElement} stopNode A parent node defining when to stop going back up the dom tree
 * @returns {HTMLElement|false} first node below the stop node (if there is one) 
 * otherwise the stopNode or false if error
 */
export const getTopParentNode = function (node, stopNode) {
    if (node == null || stopNode == null) {
        console.warn('Error. Passed null node or stopNode to getTopParentNode')
    }
    let saved = node
    while (node != stopNode) {
        saved = node
        if (node == null) {
            console.warn('Error.  Found missing node traversing tree in getTopParentNode')
            return false
        }
        if (node.parentNode == null) {
            console.warn('Error.  Found missing parent node when getting top parent node')
            return false
        }
        node = node.parentNode
    }
    return saved
}

/**
 * Insert a new node in the editor in place of the current selection
 * @param {object} editor A unique editor instance
 * @param {HTMLElement} node The new node to replace selection with
 */
export const replaceSelectionWithNode = function (editor, node) {
    const parent = editor.range.startContainer.parentNode
    // Get any pretext or post text in the current container that is not selected
    let preText = editor.range.startContainer.textContent.substring(0, editor.range.startOffset)
    let postText
    if (editor.range.collapsed) {
        postText = editor.range.startContainer.textContent.substring(editor.range.startOffset)
        // Insert leading and trailing spaces if needed
        if (preText.charAt(preText.length + 1) != ' ') {
            preText = preText + ' '
        }
        if (postText.charAt(0) != ' ') {
            postText = ' ' + postText
        }
    } else {
        postText = editor.range.startContainer.textContent.substring(editor.range.endOffset)
    }
    // Insert pretext before the current container
    if (preText) {
        parent.insertBefore(document.createTextNode(preText), editor.range.startContainer)
    }
    // Insert the node before the current container
    node = parent.insertBefore(node, editor.range.startContainer)
    console.warn(node)
    // Insert post text before the current container
    if (postText) {
        parent.insertBefore(document.createTextNode(postText), editor.range.startContainer)
    }
    // Remove the pre-existing container
    editor.range.startContainer.remove()
    // After delay set the cursor
    setTimeout(() => {
        resetCursor(node)
    }, 10)
    // return the new node
    return node
}


/**
 * Reset the cursor after replacing a selection with a new node
 * @param {HTMLElement} node 
 */
function resetCursor(node) {
    if (isCustom(node)) {
        if (node.nextSibling !== null) {
            setCursor(node.nextSibling, 0)
        } else if (node.previousSibling !== null) {
            setCursor(node.previousSibling, node.previousSibling.textContent.length)
        }
    } else {
        setCursor(node, node.textContent.length)
    }
}


/**
 * Cleans the node, removing any non-supported tags/styles
 * Invokes custom plugin cleaning if defined
 * @param {object[]} buttons array of button objects which have clean methods
 */
export const cleanForSaving = function (node: Element, buttons: any[]): void {

    // Trim text nodes with CR's
    if (node.nodeType === 3) {
        if (node.textContent?.includes('\n')) {
            node.textContent = node.textContent.trim()
        }
        return
    }
    // Now strip anything other than a normal node
    if (node.nodeType !== 1) {
        node.remove()
        return
    }

    // Check for custom node before cleaning as will remove contenteditable identifier
    const custom = isCustom(node)

    // Remove anything we don't recognise
    if (isBlock(node) === false &&
        isList(node) === false &&
        isStyle(node) === false &&
        custom === false) {

        console.warn('Removing node', node.tagName)
        node.remove()
        return
    }
    // clean styled spans
    if (node.tagName == 'SPAN') {
        cleanStyledSpan(node)
        return
    }

    // Handle custom cleaning - not just for custom nodes
    if (buttons.length > 0) {
        // Does it require cleaning?
        const match = buttons.find(
            button => button.tagName.toUpperCase() === node.tagName
        )
        if (match) {

            if (!match.clean) return

            const newNode = match.clean(node)
            if (node.parentNode == null) {
                console.error('Found missing parent node when cleaning for saving')
                return
            }
            node.parentNode.replaceChild(newNode, node)
        }
    }

    // Only stop processing if this is a custom node
    if (custom) {
        return
    }

    // Handle child nodes recursively
    node.childNodes.forEach(child => {
        cleanForSaving(<Element>child, buttons)
    })
}

/**
 * Remove none-standard styling from the span
 * @param {HTMLElement} span The span which should have at least one style
 */
function cleanStyledSpan(span) {
    const style = span.getAttribute('style')
    let newStyle = ''
    // console.log({style})
    if (style) {
        const parts = style.split(';')
        parts.forEach(part => {
            if (part) {
                if (part.includes('var(--') == false) {
                    newStyle += `${part};`
                }
            }
        })
    }
    // If have a new style then must have had an original style - in which case replace
    if (newStyle) {
        span.setAttribute('style', newStyle.trim())
        // If no new style but have a style before - must all be go - remove span
    } else if (style) {
        const text = document.createTextNode(span.textContent.trim())
        insertBefore(text, span)
        span.remove()
    }
}

let prettyHtml = ''

function tabs(level) {
    let t = '\n'
    for (let i = 0; i < level; i++) {
        t += '    '
    }
    return t
}

function indentTag(node) {
    let inline = false
    if (isCustom(node)) {
        if (node.nextElementSibling != null && node.nextElementSibling.nodeType === 3) {
            return false
        }
        return true
    }
    return isBlock(node) || isList(node)
}

function prettyPrintNode(node, level) {
    // Text node?
    if (node.nodeType == 3) {
        const text = node.textContent
        if (text != '') {
            // Indent first text nodes
            if (node.previousElementSibling == null) {
                level++
                prettyHtml += tabs(level)
            }
            prettyHtml += text
            //console.log(`Found text node ${text} at level ${level}`)
        }
        // Parent node
    } else if (node.nodeType == 1) {
        let indent = false
        if (node.tagName != 'DIV') {
            const atts = node.attributes
            let tagHtml = node.tagName
            for (let i = 0; i < atts.length; i++) {
                const att = atts[i]
                tagHtml += ` ${att.nodeName}="${att.nodeValue}"`
            }
            if (indentTag(node)) {
                indent = true
                level++
                prettyHtml += tabs(level)
            }
            prettyHtml += `<${tagHtml}>`
            //console.log(`Found node ${node.tagName} at level ${level}`)
        }
        // Children
        node.childNodes.forEach(child => {
            prettyPrintNode(child, level)
        })
        // Closing tag
        if (node.tagName != 'DIV') {
            if (indent && isCustom(node) == false) {
                prettyHtml += tabs(level)
            }
            prettyHtml += `</${node.tagName}>`
        }
    } else {
        console.warn('Found unknown node type', node.nodeType)
    }
}

export const prettyPrint = function (node) {
    prettyHtml = ''
    let level = -1
    prettyPrintNode(node, level)
    return prettyHtml
}




// -----------------------------------------------------------------------------
// @section Selection and keyboard methods
// -----------------------------------------------------------------------------

// Mark text with "unusual" none-keyboard characters
export const START_MARKER = '§§'
export const END_MARKER = '±±'

// Global variables in conjuction with finding marker nodes and resetting 
// selections
let startNode = null
let startOffset = 0
let endNode = null
let endOffset = 0


/**
 * Add start and end marks to the selected text in order to allow reselection at
 * the end of the editing operation
 * @param {Range} range 
 */
export const addMarkers = function (range) {
    // console.log('range',range)
    if (range.startContainer == range.endContainer) {
        // console.log('start container matches end container')
        range.startContainer.textContent =
            range.startContainer.textContent.substring(0, range.startOffset) +
            START_MARKER +
            range.startContainer.textContent.substring(range.startOffset, range.endOffset) +
            END_MARKER +
            range.startContainer.textContent.substring(range.endOffset)
    } else {
        // console.log('start container does NOT match end container')
        range.startContainer.textContent =
            range.startContainer.textContent.substring(0, range.startOffset) +
            START_MARKER +
            range.startContainer.textContent.substring(range.startOffset)
        range.endContainer.textContent =
            range.endContainer.textContent.substring(0, range.endOffset) +
            END_MARKER +
            range.endContainer.textContent.substring(range.endOffset)
    }
}

/**
 * Add additional properties to the range
 * @param {Range} range 
 * @returns {object|false} The original range object with additional props or false on error
 */
function augmentRange(range) {
    if (range === false) {
        console.warn('Found missing range when augmenting range')
    }
    // console.log('augmentRange',range)
    // First parent node that is a block tag
    const blockParent = getParentBlockNode(range.commonAncestorContainer)
    if (blockParent === false) {
        return false
    }
    range.blockParent = blockParent
    // First parent node
    range.rootNode = range.commonAncestorContainer
    if (range.commonAncestorContainer.nodeType === 3) {
        if (range.commonAncestorContainer.parentNode == null) {
            console.warn('Error.  Found missing parent node when augmenting range')
            return false
        }
        range.rootNode = range.commonAncestorContainer.parentNode
    }
    // Set flag to indicate whether the range is in a custom node
    range.custom = rangeStartContainerInCustom(range)
    return range
}


/**
 * Get the document range or return false if not set
 */
export const getRange = function (editorNode: HTMLElement): EditRange | null {
    let sel = window.getSelection()
    // console.log('new selection',sel)
    if (sel?.rangeCount == 1) {
        let range = <EditRange>sel.getRangeAt(0)
        // Check if common ancestor is the editor node or contained in the editor node
        // Ignore all other selectins since they don;t belong to the editor
        if (range.commonAncestorContainer == editorNode ||
            contains(editorNode, range.commonAncestorContainer)) {
            // console.log('New range found')
            range = augmentRange(range)
            return range
        }
    }
    return null
}


/**
 * Set the cursor in a text node at the specified offset and
 * return the new range
 */
export const setCursor = function (node: Element, offset: number): EditRange {
    let range = <EditRange>document.createRange()
    const selection = window.getSelection()
    // Check the offset is in range
    if (node.textContent && offset > node.textContent.length) {
        offset = 0
    }
    range.setStart(node, offset)
    range.collapse(true)
    if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
    }
    range = augmentRange(range)
    return range
}

/**
 * Restore a previously selected range
 */
export const restoreSelectedRange = function (range: EditRange): EditRange {
    const selection = window.getSelection()
    if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
    }
    range = augmentRange(range)
    return range
}

/**
 * Find the node containing the start marker
 */
const getStartNode = function (parent: Element): Element {
    return findMarkerNode(parent, START_MARKER)
}

/**
 * Find the node containing the end marker
 */
const getEndNode = function (parent: Element): Element {
    return findMarkerNode(parent, END_MARKER)
}

/**
 * Find a text node containing the given marker text. As a side effect, sets 
 * the value of startNode, endNode, startOffset and endOffset
 * @param {HTMLElement} parent The node to end searching from
 * @param {HTMLElement} marker The marker text to locate
 * @returns {boolean} true if finds marker node, false otherwise
 */
function findMarkerNode(parent: Element, marker: Element): boolean {
    for (let i = 0; i < parent.childNodes.length; i++) {
        const child = parent.childNodes[i]
        if (child.nodeType === 1) {
            if (findMarkerNode(child, marker)) {
                return true
            }
        } else if (child.nodeType === 3) {
            const index = child.textContent.indexOf(marker)
            if (index != -1) {
                // console.log('Found node with marker', marker)
                child.textContent = child.textContent.replace(marker, '')
                if (marker == START_MARKER) {
                    startNode = child
                    startOffset = index
                } else {
                    endNode = child
                    endOffset = index
                }
                return true
            }
        }
    }
    return false
}

/**
 * Reset the selection using the start and end markers
 * @param {HTMLElement} editorNode 
 * @returns {Range|false}
 */
export const resetSelection = function (editorNode) {
    if (getStartNode(editorNode) && getEndNode(editorNode)) {
        const range = document.createRange()
        const selection = window.getSelection()
        range.setStart(startNode, startOffset)
        if (startNode == endNode && startOffset == endOffset) {
            range.collapse(true)
        } else {
            range.setEnd(endNode, endOffset)
        }
        selection.removeAllRanges()
        selection.addRange(range)
        return range
    }
    return false
}


// -----------------------------------------------------------------------------
// @section Modals confirmation dialogues
// -----------------------------------------------------------------------------

// /**
//  * Display confirmation dialogue for cancel any edits. Returns as a new modal
//  */
// export const modalRequestCancel = function (callback: Function): Modal {
//     const confirm = new Modal({
//         type: 'overlay',
//         severity: 'warning',
//         title: 'Cancel changes?',
//         html: 'Do you really want to lose changes?',
//         buttons: {
//             cancel: { label: 'No - keep editing' },
//             confirm: { label: 'Yes - lose changes', callback }
//         }
//     })
//     confirm.show()
//     return confirm
// }

// /**
//  * Display confirmation dialogue for deleting an item
//  */
// export const modalRequestDelete = function (label: string, callback: Function): Modal {
//     const confirm = new Modal({
//         type: 'overlay',
//         severity: 'warning',
//         title: `Delete ${label}?`,
//         html: `Do you really want to delete this ${label}?`,
//         buttons: {
//             cancel: { label: 'No - keep editing' },
//             confirm: { label: 'Yes - delete', callback }
//         }
//     })
//     confirm.show()
//     return confirm
// }


// -----------------------------------------------------------------------------
// @section Miscellaneous
// -----------------------------------------------------------------------------

/**
 * Generate a randon uid based on the current time
 * @returns {string}
 */
export const generateUid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Smooth out key entry
 * @param {function} fn a callback function
 * @param {number} delay delay in ms before callback triggered
 * @returns 
 */
export const debounce = function (fn, delay) {
    let timeOutId
    return function (...args) {
        // Clear previous timeout if not expired
        if (timeOutId) {
            clearTimeout(timeOutId)
        }
        // Set new timeout
        timeOutId = setTimeout(() => {
            fn(...args)
        }, delay)
    }
}

