"use strict"

import * as Helpers from '../helpers.js'
import * as Inline from './inline.js'
import ToolbarButton from './ToolbarButton.js'

let range
let editor 
let handleChange

const click = function( edtr ){
    editor = edtr
    handleChange = Helpers.debounce(handleChangeDelayed,1000)
    editor.buffer.ignore = true
    range = Inline.otherClick(editor,this.tag)
    console.log('New colour range is',range)
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

// Method attached to a button in the toolbar
const disabled = function(range){
    let disabled = false
    if ( range === false ){
        disabled = true
    } else if ( range.collapsed ) {
        disabled = true
    } else if ( range.rootNode.tagName === 'DIV' ){
        disabled = true
    } else if ( Helpers.isBlock(range.rootNode) || Helpers.isInline(range.rootNode)){
        disabled = false
    // } else if ( range.rootNode.tagName === 'FGC' || range.rootNode.tagName === 'BGC'){
    //     disabled = false
    } else {
        disabled = true
    }
    this.element.disabled = disabled
    console.log('disabled', disabled)
}


// A colour picker is an example of an inline control which returns a value that needs to 
// be saved against a type of output - in this case the style
// The empty icon is replaced with the input of type color
const fgOptions = {disabled, changed:fgColourChanged, input:'color', group:'colours'}
const FGC = new ToolbarButton( 'inline', 'FGC', 'Foreground colour', '', click, fgOptions)

const bgOptions = {disabled, changed:bgColourChanged, input:'color', group:'colours'}
const BGC = new ToolbarButton( 'inline', 'BGC', 'Background colour', '', click, bgOptions)

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const buttons = [ FGC, BGC ]