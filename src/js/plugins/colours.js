"use strict"

import * as Helpers from '../helpers.js'
import * as Styles from './styles.js'
import * as Icons from '../icons.js'
import ToolbarButton from '../ToolbarButton.js'

/**
 * Show the colour input for the button supplied, saving in the global input 
 * variable.
 * The input is not displayed but triggered programmatically to display
 * a HTML5 colour input dialogue. 
 * Clicking on this triggers the input event.
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
function show(editor, button){
    const input = document.createElement('input')
    input.type = 'color'
    input.style = "display:none;"
    document.body.appendChild(input)
    input.click()
    input.addEventListener('input', event => {
        console.log('colour changed',event.target.value)
        const colour = event.target.value
        // Synthesise a button using the colour value selected
        const synthButton = {
            setState,
            style:`${button.style}:${colour}`, 
            removeStyle:button.removeStyle, 
            element:button.element
        }
        // Apply the new style
        Styles.click( editor, synthButton )
        hide(input)
    })
}

/**
 * Hide the dialogue
 * @param {HTMLInputElement} input The hidden colour input element
 */
function hide(input){
    input.remove()
}

/**
 * Mandatory button click function which displays the colour dialogue
 * for the supplied button
 * @param {object} editor A unique editor instance
 * @param {object} btn The button to act on
 */
const click = function( editor, btn ){
    if ( editor.range === false || editor.range.collapsed ){
        console.log('No non-collapsed range selected')
        return
    }
    show(editor, btn)
}

/**
 * Set the disabled and active states of a button
 * @param {object} editor A unique editor instance
 * @param {object} btn The button to act on
 */
const setState = function(editor,btn){
    // console.log('setting colour state')
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
        // Get the inline styles of the selected range
        let value = ''
        let styles = []
        const inlineStyles = editor.range.startContainer.parentNode.getAttribute('style')
        if ( inlineStyles != null ){
            styles = inlineStyles.split(';')
            // console.log('styles',styles)
            styles.forEach( item => {
                // Ignore empty styles (split creates an empty element for last ;)
                if ( item !== '' ){
                    const parts = item.split(':')
                    // Does the inline style match the button?
                    // If so set the button styling to match
                    if ( parts[0].trim() === btn.style ){
                        value = parts[1].trim()
                        btn.element.querySelector('span.bar').setAttribute('style',`background-color:${value};`)
                    }
                }
            })
        }
        if ( value == '' ){
            btn.element.querySelector('span.bar').removeAttribute('style')
        }
    }
}

const init = function(editor, button){
    const bar = document.createElement('span')
    bar.classList.add('bar')
    bar.classList.add(button.tag)
    button.element.appendChild(bar)
    button.element.classList.add('barred')
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

let options = {init, setState, style:'color', removeStyle:'color:black;'}
export const FOREGROUND = new ToolbarButton( 'inline', 'FGC', 'Foreground colour', Icons.colourForeground, click, options)

options = {init, setState, style:'background-color', removeStyle:'background-color:white;'}
export const BACKGROUND = new ToolbarButton( 'inline', 'BGC', 'Background colour', Icons.colourBackground, click, options)