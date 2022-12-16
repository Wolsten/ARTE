import ToolbarButton from '../ToolbarButton.js'
import * as Helpers from '../helpers.js'
import * as Icons from '../icons.ts'
import * as Phase from '../phase.js'

/**
 * Split the node into component parts based on the current selection
 * @param {HTMLElement} node The current text node 
 * @param {Range} range 
 * @returns 
 */
function getTextParts(node, range) {
    let text = ''
    let preText = ''
    let postText = ''
    if (Phase.both()) {
        preText = node.textContent.substring(0, range.startOffset)
        text = Helpers.START_MARKER + node.textContent.substring(range.startOffset, range.endOffset) + Helpers.END_MARKER
        postText = node.textContent.substring(range.endOffset)
    } else if (Phase.first()) {
        preText = node.textContent.substring(0, range.startOffset)
        text = Helpers.START_MARKER + node.textContent.substring(range.startOffset)
    } else if (Phase.last()) {
        text = node.textContent.substring(0, range.endOffset) + Helpers.END_MARKER
        postText = node.textContent.substring(range.endOffset)
    } else {
        text = node.textContent
    }
    return { preText, text, postText }
}

/**
 * Check whether the newStyle appears in the styles array
 * @param {string[]} styles 
 * @param {string} newStyle 
 * @returns 
 */
function styleApplied(styles, newStyle) {
    let result = -1
    styles.forEach((item, index) => {
        if (item == newStyle) {
            result = index
        }
    })
    return result
}

/**
 * 
 * @param {string[]} styles 
 * @param {string} txt 
 * @param {boolean} closeFlag true = close
 * @returns 
 */
function generateText(styles, txt, closeFlag) {
    if (styles.length == 0) {
        return txt
    }
    // Filter out older versions of the same style, e.g. so that only a later applied
    // colour is added
    let items = []
    let values = []
    let newStyles = ''
    for (let i = 0; i < styles.length; i++) {
        const parts = styles[i].split(':')
        items.push(parts[0].trim())
        values.push(parts[1].trim())
    }
    // Blanks older matching items
    for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < items.length; j++) {
            if (items[i] == items[j] && i > j) {
                items[j] = ''
            }
        }
    }
    // Construct new style attribute value
    let newStyle = ''
    for (let i = 0; i < items.length; i++) {
        if (items[i] != '') {
            newStyle += `${items[i]}:${values[i]};`
        }
    }
    let html = `<span style="${newStyle}">${txt}`
    if (closeFlag) {
        html += '</span>'
    }
    return html
}

/**
 * 
 * @param {HTMLElement} node
 * @param {string[]} styles Array of style:value pairs
 * @param {object} button The button to act on
 * @param {Range} range apply or remove
 * @returns {string}
 */
function parseTextNode(node, styles, button, range) {
    Phase.set(node)
    const { preText, text, postText } = getTextParts(node, range)
    let html = ''
    // In pre and post phases return text with current styling
    if (Phase.pre() || Phase.post()) {
        html += generateText(styles, text, true)
        // During phase 
    } else {
        // Has the style been applied already?
        const fullStyle = `${button.newStyle}:${button.newValue}`
        const idx = styleApplied(styles, fullStyle)

        let closedSpans = true

        // PRE TEXT
        if (preText) {

            if (styles.length == 0) {

                html += preText

                // Got at least one style to apply
            } else {

                // Defaults to true for cases of 'remove' and 'clear'
                closedSpans = true

                if (button.action == 'apply') {

                    // Don't close if new style is in styles list or if there is post text 
                    // which needs the same styling as the pre text
                    if (idx > -1 || postText != '') {
                        closedSpans = false
                    }
                }

                html += generateText(styles, preText, closedSpans)
            }
        }

        // SELECTED TEXT
        if (text) {

            // Apply new style?
            if (button.action == 'apply') {

                // If style already applied and the pretext spans are open 
                // just add the text
                if (idx > -1 && closedSpans == false) {
                    html += text
                } else {
                    let newStyles = []
                    // Otherwise if the pre text spans are closed add the old and new styles
                    if (closedSpans) {
                        newStyles = [...styles, fullStyle]
                        // If pre text spans open then just add the new style
                    } else {
                        newStyles = [fullStyle]
                    }

                    html += generateText(newStyles, text, true)
                }

                // Remove existing style?
            } else if (button.action == 'remove' || button.action == 'clear') {

                html += text
            }
        }

        // POST TEXT
        if (postText) {

            // No styles
            if (styles.length == 0) {

                html += postText

                // Got at least one style to apply/remove
            } else {

                // Apply styles to the post text if the spans were closed for the pre text
                if (closedSpans) {
                    html += generateText(styles, postText, true)
                    // Else close the spans from the pretext
                } else {
                    html += postText
                    styles.forEach(() => html += '</span>')
                }
            }
        }
    }
    // console.log('html', html)
    return html
}




/**
 * Parse a block node, saving inline styles as traverse down the tree
 * Cannot set the styles here as need to get to the text nodes to know when the 
 * start end end containers have been found.
 * @param {HTMLElement} node 
 * @param {string[]} styles Array of style:value pairs
 * @param {object} button The button to act on
 * @param {Range} range apply or remove
 * @returns 
 */
function parseBlockNode(node, styles, button, range) {
    // Add inline style from a span?
    if (node.tagName === 'SPAN') {
        const inlineStyles = node.getAttribute('style')
        if (inlineStyles != null && inlineStyles != '') {
            let inlineStylesArray = inlineStyles.split(';')
            inlineStylesArray.forEach(item => {
                if (item != '') {
                    const parts = item.split(':')
                    if (styles.includes(parts[0].trim()) == false) {
                        styles = [...styles, item]
                    }
                }
            })
        }
    }
    // Parse child nodes
    let html = ''
    node.childNodes.forEach(child => {
        html += parseNode(child, styles, button, range)
    })
    // console.log('Returning block html', html)
    return html
}



/**
 * Set the disabled and active states of a button
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
const setState = function (editor, button) {
    // console.log('setting style state')
    if (button.tag == 'CLEAR') {
        button.element.classList.remove('active')
    }
    // The rootNode should not be the editor or list container - (implying 
    // multiple blocks selected) 
    button.element.disabled = editor.range.collapsed ||
        editor.range.rootNode == editor.rootNode ||
        Helpers.isList(editor.range.rootNode)
    // Check whether the computed style matches the btn
    setStyleProps(button)
    const inlineStyles = Helpers.getInlineStyles(editor.range.startContainer)
    if (inlineStyles.includes(button.style)) {
        button.element.classList.add('active')
    } else {
        button.element.classList.remove('active')
    }
}

/**
 * Parse nodes recursively and generates updated html
 * @param {HTMLElement} node 
 * @param {string[]} styles Array of style:value pairs
 * @param {object} button The button to act on
 * @param {Range} range apply or remove
 * @returns {string} of the new html generated
 */
const parseNode = function (node, styles, button, range) {
    // console.log('Parsing node',node)
    // Text node
    if (node.nodeType === 3) {
        return parseTextNode(node, styles, button, range)
    }
    // Custom node
    if (Helpers.isCustom(node)) {
        return node.outerHTML
    }
    // Blocks and spans
    return parseBlockNode(node, styles, button, range)
}

/**
 * Split the style stype property into newStyle:newValue parts and set the action
 * @param {object} button
 */
const setStyleProps = function (button) {
    const styleParts = button.style.split(':')
    button.newStyle = styleParts[0]
    button.newValue = styleParts[1] !== undefined ? styleParts[1] : ''
    // Determine the action
    button.action = 'apply'
    if (button.element.classList.contains('active') && button.style != 'CLEAR') {
        button.action = 'remove'
    } else if (button.style == 'CLEAR') {
        button.action = 'clear'
    }
}


// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

/**
 * Mandatory button click function.
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
export const click = function (editor, button) {
    const range = editor.range
    // Adjust rootNode if required
    if (Helpers.isBlock(range.rootNode) == false) {
        const newRootNode = Helpers.getParentBlockNode(range.rootNode)
        if (newRootNode === false) {
            return
        }
        range.rootNode = newRootNode
    }
    // Set newStyle, newValue and action
    setStyleProps(button)
    // Initialise phase detection and parse the root node
    Phase.init(range, false)
    const html = parseNode(range.rootNode, [], button, range)
    // console.log('html',html)
    const node = Helpers.replaceNode(range.rootNode, range.rootNode.tagName, html)
    // Reset the selection
    Helpers.resetSelection(editor.editorNode)
    editor.updateRange()
    button.setState(editor, button)
    editor.buffer()
    editor.updateEventHandlers()
}

let options = { setState, style: 'font-weight:bold' }
export const B = new ToolbarButton('style', 'B', 'Bold', Icons.b, click, options)

options = { setState, style: 'font-style:italic' }
export const I = new ToolbarButton('style', 'I', 'Italic', Icons.i, click, options)

options = { setState, style: 'text-decoration:underline' }
export const U = new ToolbarButton('style', 'U', 'Underline', Icons.u, click, options)

options = { setState, style: 'CLEAR' }
export const CLEAR = new ToolbarButton('style', 'CLEAR', 'Clear', Icons.clear, click, options)