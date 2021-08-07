"use strict"

import * as Helpers from '../helpers.js'
import * as Styles from './styles.js'
import * as Icons from '../icons.js'
import ToolbarButton from '../ToolbarButton.js'

let options
let input

function show(editor, btn){
    input = document.createElement('input')
    input.type = 'color'
    input.style = "display:none;"
    document.body.appendChild(input)
    input.click()
    input.addEventListener('input', event => {
        console.log('colour changed',event.target.value)
        const colour = event.target.value
        const button = {style:`${btn.style}:${colour}`, removeStyle:btn.removeStyle, element:btn.element}
        Styles.click( editor, button )
        hide()
    })
}

function hide(){
    input.remove()
}

const click = function( editor, btn ){
    if ( editor.range === false || editor.range.collapsed ){
        console.log('No non-collapsed range selected')
        return
    }
    show(editor, btn)
}

/**
 * Set the disabled and active states of a button
 * @param range Standard range object with addition of a rootNode which is always a block
 * and is either the same as the commonAncestor ior the parent node of this when it is a text node
 */
const setState = function(range){
    console.log('setting colour state')
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
        // Get the inline styles of the selected range
        let value = ''
        let styles = []
        const inlineStyles = range.startContainer.parentNode.getAttribute('style')
        if ( inlineStyles != null ){
            styles = inlineStyles.split(';')
            // console.log('styles',styles)
            styles.forEach( item => {
                // Ignore empty styles (split creates an empty element for last ;)
                if ( item !== '' ){
                    const parts = item.split(':')
                    // Does the inline style match the button?
                    // If so set the button styling to match
                    if ( parts[0].trim() === this.style ){
                        value = parts[1].trim()
                        this.element.setAttribute('style',`${this.style}:${value};`)
                    }
                }
            })
        }
        if ( value == '' ){
            this.element.setAttribute('style', this.removeStyle)
        }
    }
}

options = {setState, style:'color', removeStyle:'color:black;'}
const FGC = new ToolbarButton( 3, 'inline', 'FGC', 'Foreground colour', Icons.colourForeground, click, options)

options = {setState, style:'background-color', removeStyle:'background-color:white;'}
const BGC = new ToolbarButton( 3, 'inline', 'BGC', 'Background colour', Icons.colourBackground, click, options)

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const buttons = [ FGC, BGC ]