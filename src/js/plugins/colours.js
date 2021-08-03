"use strict"

import * as Helpers from '../helpers.js'
import * as Inline from './inline.js'
import * as Icons from './icons.js'
import ToolbarButton from './ToolbarButton.js'

let range
let style
let value
let removeStyle
let options
let action

const click = function( edtr ){
    if ( edt.range === false ){
        console.log('No range selected')
        return
    }
    editor = edtr
    // handleChange = Helpers.debounce(handleChangeDelayed,1000)
    // editor.buffer.ignore = true
    // range = Inline.otherClick(editor,this.tag)
    // console.log('New colour range is',range)
}

const fgColourChanged = function( ){
    console.log('range', range)
    console.log('change in colour', this.element.value)
    // Apply colour change to start container first
    let node = range.startContainer.parentNode
    node.style = `color:${this.element.value};`
    // Apply colour to end container if it is different
    if ( range.endContainer != range.startContainer ){
        node = range.endContainer.parentNode
        node.style = `color:${this.element.value};`
    }
    handleChange()
}

const bgColourChanged = function( ){
    console.log('range', range)
    console.log('change in background colour', this.element.value)
    // Apply colour change to start container first
    let node = range.startContainer.parentNode
    node.style = `background-color:${this.element.value};`
    // Apply colour to end container if it is different
    if ( range.endContainer != range.startContainer ){
        node = range.endContainer.parentNode
        node.style = `background-color:${this.element.value};`
    }
    handleChange()
}

const handleChangeDelayed = function(){
    editor.buffer.update()
}

/**
 * Split the style stype property into style:value parts
 * @param string tag in format style or style:value
 */
 function setStyle(styleProp){
    const styleParts = styleProp.split(':')
    style = styleParts[0]
    value = styleParts[1] !== undefined ? styleParts[1] : ''
}

/**
 * Set the disabled and active states of a button
 * @param range Standard range object with addition of a rootNode which is always a block
 * and is either the same as the commonAncestor ior the parent node of this when it is a text node
 */
 const setState = function(range){
    if ( range === false ){
        this.element.disabled = true
        this.element.classList.remove('active')
    } else if ( this.tag == 'CLEAR' ){
        this.element.disabled = false
        this.element.classList.remove('active')
    } else {
        // The rootNode should not be a DIV (the editor) or list container - (implying 
        // multiple blocks selected) or a custom element
        this.element.disabled = range.rootNode.tagName === 'DIV' || 
                                Helpers.isList(range.rootNode) ||
                                Helpers.isCustom(range.rootNode)
        // Check whether the computed style matches the button
        setStyle( this.style )
        const computedStyles = window.getComputedStyle( range.startContainer.parentNode )
        const property = computedStyles.getPropertyValue(style)
        if ( property ){
            this.element.style = `${this.style}:${property}`
        } else {
            this.element.style.remove()
        }
    }
}


options = {setState, style:'color:', removeStyle:'color:black'}
const FGC = new ToolbarButton( 3, 'inline', 'FGC', 'Foreground colour', Icons.colourForeground, click, options)

options = {setState, style:'color:', removeStyle:'color:white'}
const BGC = new ToolbarButton( 3, 'inline', 'BGC', 'Background colour', Icons.colourBackground, click, options)

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const buttons = [ FGC, BGC ]