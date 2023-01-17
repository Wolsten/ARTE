

import EditRange from './EditRange.js'
import ToolbarButton, { ToolbarButtonType } from './ToolbarButton.js'



// -----------------------------------------------------------------------------
// @section Arrays
// -----------------------------------------------------------------------------

/**
 * Tests whether two arrays are equal - neither can be empty
 * Returns true if neither empty and all values equal
 */
export const arraysEqual = function (a: any[], b: any[]): boolean {
    if (a.length != 0 && b.length != 0 && a.length != b.length) {
        return false
    }
    return a.every((item, index) => b[index] == item)
}

/**
 * Check whether array item in a is also a member of b
 */
export const arraySubset = function (a: any[], b: any[]): boolean {
    return a.every((item, index) => b[index] == item)
}


// -----------------------------------------------------------------------------
// @section Dom manipulation
// -----------------------------------------------------------------------------

// Common tags to be supported
export let tags = {
    block: ['DIV', 'LI'],
    list: ['LI'],
    custom: <string[]>[]
}

/**
 * Register a new button type with tag to allow future checking/cleaning
 */
export const registerTag = function (type: ToolbarButtonType, tag: string): void {
    if (tag === 'CLEAR') return
    switch (type) {
        case ToolbarButtonType.BLOCK:
            if (!tags.block.includes(tag)) tags.block.push(tag)
            return
        case ToolbarButtonType.LIST:
            if (!tags.list.includes(tag)) tags.list.push(tag)
            return
        case ToolbarButtonType.CUSTOM:
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
    console.log('customs', tags.custom.join(', '))
}

/**
 * Insert newNode after existingNode
 * Returns the new node inserted or null if fails
 */
export const insertAfter = function (newNode: HTMLElement | null, existingNode: HTMLElement | null): HTMLElement | null {
    if (!newNode) {
        console.error('Error in insertAfter.  New node is null')
        return null
    }
    if (!existingNode) {
        console.error('Error in insertAfter.  Existing node is null')
        return null
    }
    const parentNode = existingNode.parentNode
    if (parentNode) {
        return parentNode.insertBefore(newNode, existingNode.nextSibling);
    }
    return null
}

/**
 * Insert newNode before existingNode
 * Returns the new node inserted or null if fails
 */
export const insertBefore = function (newNode: Text | HTMLElement | null, existingNode: Text | HTMLElement | null): Text | HTMLElement | null {
    if (!newNode) {
        console.error('Error in insertAfter.  New node is null')
        return null
    }
    if (!existingNode) {
        console.error('Error in insertAfter.  Existing node is null')
        return null
    }
    const parentNode = existingNode.parentNode
    if (parentNode) {
        return parentNode.insertBefore(newNode, existingNode);
    }
    return null
}

/**
 * Replace an existing node with the returned new node and html
 * If fails returns null
 */
export const replaceNode = function (existingNode: Node, newNodeTag: string, newNodeHtml: string): Node | null {
    if (!existingNode?.parentNode) {
        console.warn('Error.  Found when replacing an existing node with a new node', existingNode)
        return null
    }
    const replacementNode = document.createElement(newNodeTag)
    replacementNode.innerHTML = newNodeHtml
    const node = existingNode.parentNode.insertBefore(replacementNode, existingNode)
    existingNode.parentNode.removeChild(existingNode)
    return node
}

/**
 * Check whether the node is an inline style span
 */
export const isStyle = function (node: HTMLElement): boolean {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return false
    }
    return node.tagName === 'SPAN' || node.tagName === 'I'
}

/**
 * Check whether the node is a list container
 */
export const isList = function (node: HTMLElement): boolean {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return false
    }
    return node.tagName === 'OL' || node.tagName === 'UL'
}

/**
 * Check whether the node is a block container
 */
export const isBlock = function (node: Node | null): boolean {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) {
        return false
    }
    return tags.block.includes(node.nodeName)
}

/**
 * Checks whether the element is a custom element
 */
export const isCustom = function (node: HTMLElement): boolean {
    if (node.tagName == undefined) {
        return false
    }
    return tags.custom.includes(node.tagName)
}

// /**
//  * Return true if child is not the parent but contains the parent
//  */
// export function contains(parent: HTMLElement, child: Node): boolean {
//     return parent !== child && parent.contains(child)
// }


/**
 * Get the first "supported" block node, may be the node passed in
 * or could be the editor itself (a DIV)
 */
export const getParentBlockNode = function (node: Node): Node {
    while (isBlock(node) == false) {
        node = <Node>node.parentNode
    }
    return node
}


/**
 * Get the parent editor node (first one with content editable set to true) of a node
 */
export const getEditorNode = function (node: HTMLElement): HTMLElement {
    while (node.getAttribute('contenteditable') !== "true") {
        if (node.parentNode == null) {
            console.warn('Error.  Found missing parent node when getting editor node')
        } else {
            node = <HTMLElement>node.parentNode
        }
    }
    return node
}


/**
 * Cleans the node, removing any non-supported tags/styles
 * Invokes custom plugin cleaning if defined
 * The buttons array of button objects which have clean methods
 */
export const cleanForSaving = function (node: HTMLElement, buttons: ToolbarButton[]): void {

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
            button => button.tag.toUpperCase() === node.tagName
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
        cleanForSaving(<HTMLElement>child, buttons)
    })
}


/**
 * Remove none-standard styling from the span
 * which should have at least one style
 */
function cleanStyledSpan(span: HTMLElement) {
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
    } else if (style && span.textContent) {
        const text = document.createTextNode(span.textContent.trim())
        insertBefore(text, span)
        span.remove()
    }
}


function tabs(level: number) {
    let t = '\n'
    for (let i = 0; i < level; i++) {
        t += '    '
    }
    return t
}


function indentTag(node: HTMLElement) {
    if (isCustom(node)) {
        if (node.nextElementSibling != null && node.nextElementSibling.nodeType === Node.TEXT_NODE) {
            return false
        }
        return true
    }
    return isBlock(node) || isList(node)
}


// -----------------------------------------------------------------------------
// @section Pretty printing
// -----------------------------------------------------------------------------

let prettyHtml = ''

function prettyPrintNode(node: HTMLElement, level: number) {
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
            let tagHtml = node.tagName
            for (let i = 0; i < node.attributes.length; i++) {
                const attribute = node.attributes[i]
                tagHtml += ` ${attribute.nodeName}="${attribute.nodeValue}"`
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
            prettyPrintNode(<HTMLElement>child, level)
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



export const prettyPrint = function (node: HTMLElement): string {
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

// Global variables in conjunction with finding marker nodes and resetting 
// selections
let startNode: HTMLElement | null = null
let startOffset = 0
let endNode: HTMLElement | null = null
let endOffset = 0


/**
 * Add start and end marks to the selected text in order to allow reselection at
 * the end of the editing operation
 */
export const addMarkers = function (range: EditRange) {
    // console.log('range',range)
    if (!range.startContainer || !range.endContainer) {
        console.error('Missing content when trying to add a marker')
        return
    }
    const startText = range.startContainer?.textContent || ''
    const endText = range.endContainer?.textContent || ''
    if (range.startContainer == range.endContainer) {
        // console.log('start container matches end container')
        range.startContainer.textContent =
            startText.substring(0, range.startOffset) +
            START_MARKER +
            startText.substring(range.startOffset, range.endOffset) +
            END_MARKER +
            startText.substring(range.endOffset)
    } else {
        // console.log('start container does NOT match end container')
        range.startContainer.textContent =
            startText.substring(0, range.startOffset) +
            START_MARKER +
            startText.substring(range.startOffset)
        range.endContainer.textContent =
            endText.substring(0, range.endOffset) +
            END_MARKER +
            endText.substring(range.endOffset)
    }
}

/**
 * Find the node containing the start marker
 */
const getStartNode = function (parent: HTMLElement): boolean {
    return findMarkerNode(parent, START_MARKER)
}

/**
 * Find the node containing the end marker
 */
const getEndNode = function (parent: HTMLElement): boolean {
    return findMarkerNode(parent, END_MARKER)
}

/**
 * Find a text node containing the given marker text. As a side effect, sets 
 * the value of startNode, endNode, startOffset and endOffset
 * returns true if finds marker node, false otherwise
 */
function findMarkerNode(parent: HTMLElement, marker: string): boolean {
    for (let i = 0; i < parent.childNodes.length; i++) {
        const child = <HTMLElement>parent.childNodes[i]
        if (child.nodeType === 1) {
            if (findMarkerNode(child, marker)) {
                return true
            }
        } else if (child.nodeType === 3) {
            if (child.textContent) {
                const index = child.textContent?.indexOf(marker)
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
    }
    return false
}

/**
 * Reset the selection using the start and end markers
 */
export const resetSelection = function (editorNode: HTMLElement): Range | false {
    if (getStartNode(editorNode) && getEndNode(editorNode)) {
        const range = document.createRange()
        const selection = window.getSelection()
        if (selection) {
            range.setStart(<Node>startNode, startOffset)
            if (startNode == endNode && startOffset == endOffset) {
                range.collapse(true)
            } else {
                range.setEnd(<Node>endNode, endOffset)
            }
            selection.removeAllRanges()
            selection.addRange(range)
            return range
        }
    }
    return false
}


// -----------------------------------------------------------------------------
// @section Miscellaneous
// -----------------------------------------------------------------------------

/**
 * Generate a random uid based on the current time
 */
export const generateUid = function (): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Smooth out key entry
 */
export const debounce = function (callback: Function, msBeforeTriggeringCallback: number): Function {
    let timeOutId: NodeJS.Timeout
    return function (...args: any[]) {
        // Clear previous timeout if not expired
        if (timeOutId) {
            clearTimeout(timeOutId)
        }
        // Set new timeout
        timeOutId = setTimeout(() => {
            callback(...args)
        }, msBeforeTriggeringCallback)
    }
}

