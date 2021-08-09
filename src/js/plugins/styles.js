"use strict"

import * as Helpers from '../helpers.js'
import ToolbarButton from '../ToolbarButton.js'
import * as Icons from '../icons.js'
import * as Phase from '../phase.js'

let range
let style
let button
let value
let removeStyle
let options
let action

/**
 * Split the style stype property into style:value parts
 * @param string tag in format style or style:value
 */
function setStyle(styleProp){
    const styleParts = styleProp.split(':')
    style = styleParts[0]
    value = styleParts[1] !== undefined ? styleParts[1] : ''
}


function parseTextNode( node, styles ) {
    Phase.set( node )
    //const computedStyles = window.getComputedStyle(node.parentNode)
    let text = ''
    let preText = ''
    let postText = ''
    let openSpan = ''
    let closeSpan = ''
    if ( Phase.during() ){
        if ( action == 'apply' ){
            // If not already present - add the new style
            let found = ''
            let idx = -1
            styles.forEach( (item,index) => {
                const parts = item.split(':')
                if ( parts[0].trim() == style ){
                    idx = index
                }
            })
            // Remove style with old value
            if ( idx != -1 ){
                styles = styles.filter( (item,index) => index != idx )
            }
            // Add style with new value
            const newStyle = `${style}:${value}`
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
                openSpan = `<span style="${styles.join(';')};${removeStyle}">`
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
 * @param node node 
 * @param [] styles 
 * @returns 
 */
function parseBlockNode(node, styles){
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
        html += parseNode( child, styles )
    })
    console.log('Returning block html', html)
    return html
}

/**
 * Parse nodes recursively and generates updated html
 * @param node node 
 * @param array styles 
 * @returns string of the new html generated
 */
function parseNode(node, styles){
    console.log('Parsing node',node)
    // Text node
    if ( node.nodeType === 3 ){
        return parseTextNode( node, styles )
    }
    // Custom node
    if ( Helpers.isCustom(node) ){
        return node.outerHTML
    }
    // Blocks and spans
    return parseBlockNode(node, styles)
}

/**
 * Button click function, where "this" = button instance
 * @param {*} editor The editor object
 */
export const click = function( editor, btn ){
    range = editor.range
    button = btn
    removeStyle = button.removeStyle
    // Adjust rootNode if required
    if ( Helpers.isBlock(range.rootNode) == false ){
        range.rootNode = Helpers.getParentBlockNode( range.rootNode )
    }
    setStyle(button.style)
    // Determine the action
    action = 'apply'
    if ( button.element.classList.contains('active') || style == 'CLEAR') {
        action = 'remove'
    }
    // Initialise phase detection and parse the root node
    Phase.init(range, false)
    const html = parseNode(range.rootNode, [])
    console.log('html',html)
    const node = Helpers.replaceNode( range.rootNode, range.rootNode.tagName, html )
    // Reset the selection
    Helpers.resetSelection(editor.editorNode)
    editor.updateRange()
    button.setState( editor, button )
}

/**
 * Set the disabled and active states of a button
 * @param range Standard range object with addition of a rootNode which is always a block
 * and is either the same as the commonAncestor ior the parent node of this when it is a text node
 */
const setState = function(editor, btn){
    // console.log('setting style state')
    if ( editor.range === false ){
        btn.element.disabled = true
        btn.element.classList.remove('active')
    } else if ( btn.tag == 'CLEAR' ){
        btn.element.disabled = false
        btn.element.classList.remove('active')
    } else {
        // The rootNode should not be a DIV (the editor) or list container - (implying 
        // multiple blocks selected) or a custom element
        btn.element.disabled = editor.range.rootNode.tagName === 'DIV' || 
                                Helpers.isList(editor.range.rootNode) ||
                                Helpers.isCustom(editor.range.rootNode)
        // Check whether the computed style matches the btn
        setStyle( btn.style )
        const inlineStyles = Helpers.getInlineStyles( editor.range.startContainer )
        if ( inlineStyles.includes(btn.style) ){
            btn.element.classList.add('active')
        } else {
            btn.element.classList.remove('active')
        }
    }
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

options = {setState, style:'font-weight:bold', removeStyle:'font-weight:400'}
export const B = new ToolbarButton( 'style', 'B', 'Bold', Icons.b, click, options)

options = {setState, style:'font-style:italic', removeStyle:'font-style:normal'}
export const I = new ToolbarButton( 'style', 'I', 'Italic', Icons.i, click, options)

options = {setState, style:'text-decoration:underline', removeStyle:'text-decoration:none'}
export const U = new ToolbarButton( 'style', 'U',  'Underline', Icons.u, click, options)

options = {setState, style:'CLEAR'}
export const CLEAR = new ToolbarButton( 'style', 'CLEAR', 'Clear', Icons.clear, click, options)

// export const buttons = [ B, I, U, CLEAR ]