"use strict"

import ToolbarButton from '../ToolbarButton.js'
import * as Helpers from '../helpers.js'
import * as Icons from '../icons.js'
import * as Phase from '../phase.js'

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
    let text = ''
    let preText = ''
    let postText = ''
    let openSpan = ''
    let closeSpan = ''
    if ( Phase.during() ){
        if ( button.action == 'apply' ){
            // If not already present - add the new style
            let found = ''
            let idx = -1
            styles.forEach( (item,index) => {
                const parts = item.split(':')
                if ( parts[0].trim() == button.newStyle ){
                    idx = index
                }
            })
            // Remove style with old value
            if ( idx != -1 ){
                styles = styles.filter( index => index != idx )
            }
            // Add style with new value
            const newStyle = `${button.newStyle}:${button.newValue}`
            styles = [...styles, newStyle]
            openSpan = `<span style="${styles.join(';')}">`
            closeSpan = '</span>'
        } else if ( style != 'CLEAR' ) {
            // Remove the style
            styles = styles.filter( item => {
                const parts = item.split(':')
                return parts[0].trim() != style
            })
            if ( styles.length > 0 ){
                openSpan = `<span style="${styles.join(';')};${button.removeStyle}">`
                closeSpan = '</span>'
            }
        }
        // Don't need to handle clear explicitly as this is the default
    } else {
        if ( styles.length > 0 ){
            openSpan = `<span style="${styles.join(';')}">`
            closeSpan = '</span>'
        }
    }
    if ( Phase.pre() || Phase.post() ){
        return openSpan + node.textContent + closeSpan
    }
    if ( Phase.both() ){
        preText = node.textContent.substring(0,range.startOffset)
        text = Helpers.START_MARKER + node.textContent.substring(range.startOffset, range.endOffset) + Helpers.END_MARKER
        postText = node.textContent.substring( range.endOffset )
        return preText + openSpan + text + closeSpan + postText
    }
    if ( Phase.first() ){
        preText = node.textContent.substring(0,range.startOffset)
        text = Helpers.START_MARKER + node.textContent.substring(range.startOffset)
        return preText + openSpan + text + closeSpan
    }
    if ( Phase.last() ){
        text = node.textContent.substring(0,range.endOffset) + Helpers.END_MARKER
        postText = node.textContent.substring(range.endOffset)
        return openSpan + text + closeSpan + postText
    }
    if ( Phase.during() ){
        return openSpan + node.textContent + closeSpan
    }
    console.warn('Error: Found a missing state with node',node)
    return ''
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
    console.log('Returning block html', html)
    return html
}



/**
 * Set the disabled and active states of a button
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
const setState = function(editor, button){
    // console.log('setting style state')
    if ( editor.range === false  || 
        (editor.range.collapsed==false && editor.range.startContainer != editor.range.endContainer) ){
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
    console.log('Parsing node',node)
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
    if ( button.element.classList.contains('active') || button.style == 'CLEAR') {
        button.action = 'remove'
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
    console.log('html',html)
    const node = Helpers.replaceNode( range.rootNode, range.rootNode.tagName, html )
    // Reset the selection
    Helpers.resetSelection(editor.editorNode)
    editor.updateRange()
    button.setState( editor, button )
}

let options = {setState, style:'font-weight:bold', removeStyle:'font-weight:400'}
export const B = new ToolbarButton( 'style', 'B', 'Bold', Icons.b, click, options)

options = {setState, style:'font-style:italic', removeStyle:'font-style:normal'}
export const I = new ToolbarButton( 'style', 'I', 'Italic', Icons.i, click, options)

options = {setState, style:'text-decoration:underline', removeStyle:'text-decoration:none'}
export const U = new ToolbarButton( 'style', 'U',  'Underline', Icons.u, click, options)

options = {setState, style:'CLEAR'}
export const CLEAR = new ToolbarButton( 'style', 'CLEAR', 'Clear', Icons.clear, click, options)