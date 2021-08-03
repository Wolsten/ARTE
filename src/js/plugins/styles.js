"use strict"

import * as Helpers from '../helpers.js'
import ToolbarButton from './ToolbarButton.js'
import * as Icons from './icons.js'
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
        let newStyle = `${style}:${value}`
        if ( action == 'apply' ){
            // If not already present - add the new style
            if ( styles.includes(newStyle) == false ) {
                styles = [...styles, newStyle]
            }
            openSpan = `<span style="${styles.join(';')}">`
            closeSpan = '</span>'
        } else if ( style != 'CLEAR' ) {
            // Remove the style
            styles = styles.filter( item => item != newStyle )
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
                    if ( styles.includes( item ) == false ){
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
 * @param {*} ed The editor object
 */
const click = function( editor ){
    range = editor.range
    button = this
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
}

/**
 * Set the disabled and active states of a button
 * @param range Standard range object with addition of a rootNode which is always a block
 * and is either the same as the commonAncestor ior the parent node of this when it is a text node
 */
const setState = function(range){
    // If have a "this" defined then it is a button click, otherwise invoked from 
    // the insert method after the text insertion, in which case reuse the button value
    if ( this !== undefined ){
        button = this
    }
    if ( range === false ){
        button.element.disabled = true
        button.element.classList.remove('active')
    } else if ( button.tag == 'CLEAR' ){
        button.element.disabled = false
        button.element.classList.remove('active')
    } else {
        // The rootNode should not be a DIV (the editor) or list container - (implying 
        // multiple blocks selected) or a custom element
        button.element.disabled = range.rootNode.tagName === 'DIV' || 
                                Helpers.isList(range.rootNode) ||
                                Helpers.isCustom(range.rootNode)
        // Check whether the computed style matches the button
        setStyle( button.style )
        const inlineStyles = Helpers.getInlineStyles( range.startContainer )
        if ( inlineStyles.includes(button.style) ){
            button.element.classList.add('active')
        } else {
            button.element.classList.remove('active')
        }
    }
}


options = {setState, style:'font-weight:bold', removeStyle:'font-weight:400'}
const B = new ToolbarButton( 3, 'style', 'B', 'Bold', Icons.b, click, options)

options = {setState, style:'font-style:italic', removeStyle:'font-style:normal'}
const I = new ToolbarButton( 3, 'style', 'I', 'Italic', Icons.i, click, options)

options = {setState, style:'text-decoration:underline', removeStyle:'text-decoration:none'}
const U = new ToolbarButton( 3, 'style', 'U',  'Underline', Icons.u, click, options)

options = {setState, style:'CLEAR'}
const CLEAR = new ToolbarButton( 3, 'style', 'CLEAR', 'Clear', Icons.clear, click, options)

export const buttons = [ B, I, U, CLEAR ]