import ToolbarButton from '../ToolbarButton.js'
import * as Helpers from '../helpers.js'
import * as Icons from '../icons.js'
import * as Phase from '../phase.js'

/**
 * Split the node into component parts based on the current selection
 * @param {HTMLElement} node The current text node 
 * @param {Range} range 
 * @returns 
 */
function getTextParts(node,range){
    let text = ''
    let preText = ''
    let postText = ''
    if ( Phase.both() ){
        preText = node.textContent.substring(0,range.startOffset)
        text = Helpers.START_MARKER + node.textContent.substring(range.startOffset,range.endOffset) + Helpers.END_MARKER
        postText = node.textContent.substring( range.endOffset )
    } else if ( Phase.first() ){
        preText = node.textContent.substring(0,range.startOffset)
        text = Helpers.START_MARKER + node.textContent.substring(range.startOffset)
    } else if ( Phase.last() ){
        text = node.textContent.substring(0,range.endOffset) + Helpers.END_MARKER
        postText = node.textContent.substring(range.endOffset)
    } else {
        text = node.textContent
    }
    return {preText, text, postText}
}

/**
 * Check whether the newStyle appears in the styles array
 * @param {string[]} styles 
 * @param {string} newStyle 
 * @returns 
 */
function styleApplied(styles,newStyle){
    let result = -1
    styles.forEach( (item,index) => {
        if ( item == newStyle ){
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
function generateText(styles, txt, closeFlag){
    if ( styles.length == 0 ){
        return txt
    }
    let html = `<span style="${styles.join(';')}">${txt}`
    if ( closeFlag ){
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
 function parseTextNode( node, styles, button, range ) {
    Phase.set( node )
    const {preText, text, postText} = getTextParts(node,range)
    let newStyle = button.newStyle
    let html = ''
    // In pre and post phases return text with current styling
    if ( Phase.pre() || Phase.post() ){
        html += generateText(styles, text, true)
    // During phase 
    } else {
        // Has the style been applied already?
        const fullStyle = `${button.newStyle}:${button.newValue}`
        const idx = styleApplied(styles, fullStyle)
        // If have pretext or post text then apply current styles
        if ( preText || postText ) {
            html += generateText(styles, preText, 0)
        }
        // Check text
        if ( text ){
            // Apply new style?
            if ( button.action == 'apply' ){
                // If already applied then ignore
                if ( idx > -1 ){
                    newStyle = ''
                // Otherwise apply
                } else {
                    newStyle = fullStyle
                }
                // if no preText apply all styles to the selected text
                let newStyles = []
                if ( preText == '' && newStyle ){
                    newStyles = [...styles, newStyle]
                // Otherwise just apply the new style
                } else {
                    newStyles = [newStyle]
                }
                html += generateText(newStyles, text, 1)
            // Remove existing style?
            } else if ( button.action == 'remove' ) {

                // If already applied then apply remove style
                if ( idx > -1 ){
                    const removeStyles = [button.removeStyle]
                    html += generateText(removeStyles, text, 1)
                // Else just save text
                } else {
                    html += text
                }
            
            } else if ( button.action == 'clear' ) {
                console.log('adding clear text')
                html += text
            }

        }

        if ( postText ){
            html += postText 
        }

        // Close an opening span?
        const openSpans = html.split('<span ').length - 1
        const closeSpans = html.split('</span>').length - 1
        if ( openSpans > closeSpans ){
            html += '</span>'
        }

    }
    console.log('html', html)
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
function parseBlockNode(node, styles, button, range){
    // Add inline style from a span?
    if ( node.tagName === 'SPAN' ){
        const inlineStyles = node.getAttribute('style')
        if ( inlineStyles != null && inlineStyles != '' ){
            let inlineStylesArray = inlineStyles.split(';')
            inlineStylesArray.forEach( item => {
                if ( item != '' ){
                    const parts = item.split(':')
                    if ( styles.includes( parts[0].trim() ) == false ){
                        styles = [...styles, item]
                    }
                }
            })
        }
    }
    // Parse child nodes
    let html = ''
    node.childNodes.forEach( child => {
        html += parseNode( child, styles, button, range )
    })
    // console.log('Returning block html', html)
    return html
}



/**
 * Set the disabled and active states of a button
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
const setState = function(editor, button){
    // console.log('setting style state')
    if ( editor.range === false ) {


    // }  || 
    //     editor.range.collapsed==true ) {

        // } || 
        // //  editor.range.startContainer != editor.range.endContainer) ){
        // editor.range.rootNode == editor.editorNode ||
        // Helpers.isList(editor.range.rootNode) ){

        button.element.disabled = true
        button.element.classList.remove('active')
    } else if ( button.tag == 'CLEAR' ){
        button.element.disabled = false
        button.element.classList.remove('active')
    } else {
        // The rootNode should not be a DIV (the editor) or list container - (implying 
        // multiple blocks selected) or a custom element
        button.element.disabled = editor.range.rootNode.tagName === 'DIV' || 
                                Helpers.isList(editor.range.rootNode) ||
                                Helpers.isCustom(editor.range.rootNode)
        // Check whether the computed style matches the btn
        setStyleProps( button )
        const inlineStyles = Helpers.getInlineStyles( editor.range.startContainer )
        if ( inlineStyles.includes(button.style) ){
            button.element.classList.add('active')
        } else {
            button.element.classList.remove('active')
        }
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
 const parseNode = function(node, styles, button, range){
    // console.log('Parsing node',node)
    // Text node
    if ( node.nodeType === 3 ){
        return parseTextNode( node, styles, button, range )
    }
    // Custom node
    if ( Helpers.isCustom(node) ){
        return node.outerHTML
    }
    // Blocks and spans
    return parseBlockNode(node, styles, button, range)
}

/**
 * Split the style stype property into newStyle:newValue parts and set the action
 * @param {object} button
 */
const setStyleProps = function(button){
    const styleParts = button.style.split(':')
    button.newStyle = styleParts[0]
    button.newValue = styleParts[1] !== undefined ? styleParts[1] : ''
    // Determine the action
    button.action = 'apply'
    if ( button.element.classList.contains('active') && button.style != 'CLEAR') {
        button.action = 'remove'
    } else if ( button.style == 'CLEAR' ){
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
 export const click = function( editor, button ){
    const range = editor.range
    // Adjust rootNode if required
    if ( Helpers.isBlock(range.rootNode) == false ){
        range.rootNode = Helpers.getParentBlockNode( range.rootNode )
    }
    // Set newStyle, newValue and action
    setStyleProps(button)
    // Initialise phase detection and parse the root node
    Phase.init(range, false)
    const html = parseNode(range.rootNode, [], button, range)
    // console.log('html',html)
    const node = Helpers.replaceNode( range.rootNode, range.rootNode.tagName, html )
    // Reset the selection
    Helpers.resetSelection(editor.editorNode)
    editor.updateRange()
    button.setState( editor, button )
}

let options = {setState, style:'font-weight:bold', removeStyle:'font-weight:normal'}
export const B = new ToolbarButton( 'style', 'B', 'Bold', Icons.b, click, options)

options = {setState, style:'font-style:italic', removeStyle:'font-style:normal'}
export const I = new ToolbarButton( 'style', 'I', 'Italic', Icons.i, click, options)

options = {setState, style:'text-decoration:underline', removeStyle:'text-decoration:none'}
export const U = new ToolbarButton( 'style', 'U',  'Underline', Icons.u, click, options)

options = {setState, style:'CLEAR'}
export const CLEAR = new ToolbarButton( 'style', 'CLEAR', 'Clear', Icons.clear, click, options)