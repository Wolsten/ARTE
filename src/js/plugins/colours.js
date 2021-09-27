import * as Helpers from '../helpers.js'
import * as Styles from './styles.js'
import * as Icons from '../icons.js'
import ToolbarButton from '../ToolbarButton.js'
import Modal from '../Modal.js'

const PALETTE = ['black','white','violet','indigo','blue','green','yellow','orange','red']
let editor
let button
let drawer = null

/**
 * Set the colours in the colours dialogue according to the curerntly selected
 * hue, saturation and lightness values
 * @param {HTMLElement} target black and white button
 * @param {string} colour 'black' or 'white'
 */
function XXXcolourise(target,colour){
    // Remove active classes
    const actives = drawer.panel.querySelectorAll('.active')
    actives.forEach( active => active.classList.remove('active'))
    // Gradient colour selected?
    if ( target == undefined ){
        const hues = drawer.panel.querySelectorAll('.colours .hues span')
        hues.forEach( (item,i) => {
            const h = i * H_INC
            item.style.backgroundColor = `hsl(${h},100%,50%)`
            if ( h == hue ){
                item.classList.add('active')
            }
        })
        const saturations = drawer.panel.querySelectorAll('.colours .saturations span')
        saturations.forEach( (item,i) => {
            const s = i * S_INC
            item.style.backgroundColor = `hsl(${hue},${s}%,50%)`
            if ( s == saturation ){
                item.classList.add('active')
            }
        })
        const lightnesses = drawer.panel.querySelectorAll('.colours .lightnesses span')
        lightnesses.forEach( (item,i) => {
            const l = i * L_INC
            item.style.backgroundColor = `hsl(${hue},50%,${l}%)`
            if ( l == lightness ){
                item.classList.add('active')
            }
        })
    // Handle black and white
    } else {
        target.classList.add('active')
        hue = 0
        saturation = 100
        if ( colour == 'black' ){
            lightness = 0
        } else {
            lightness = 100
        }
    }
    drawer.panel.querySelector('form .result span').style.backgroundColor = `hsl(${hue},${saturation}%,${lightness}%)`
}


/**
 * Construct the colour dialogue
 * @param {object} button 
 * @returns 
 */function form(){
    let colours = ''
    for( let i=0; i<PALETTE.length; i++ ){
        colours += `<span class="colour" data-index="${i}" style="background-color:${PALETTE[i]}">&nbsp;</span>`
    }
    return `
        <form id="colour-menu">
            <div class="colours">
                ${colours}
            </div>
        </form>`
}

/**
 * Save the currently selected colour values
 */
function XXXsave(){
    // Round up values to nearest integer
    hue = Math.round(hue)
    saturation = Math.round(saturation)
    lightness = Math.round(lightness)
    const colour = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    // Synthesise a button using the colour value selected
    const synthButton = {
        setState,
        style:`${button.style}:${colour}`, 
        element:button.element
    }
    drawer.hide()
    // Apply the new style
    Styles.click( editor, synthButton )
}

/**
 * Show the colour input for the button supplied, saving in the global input 
 * variable.
 * The input is not displayed but triggered programmatically to display
 * a HTML5 colour input dialogue. 
 * Clicking on this triggers the input event.
 */
function show(){
    let title = "Select highlight colour"
    if ( button.tag == 'FGC'){
        title = "Select text colour"
    }
    // Display the panel
    drawer = new Modal({
        type:'drawer',
        title,
        html:form(),
        escape: true,
        buttons: {
            cancel: {label:'Cancel'}
        }
    })
    drawer.show()
    // Add custom click handlers
    const colours = drawer.panel.querySelectorAll('span.colour')
    colours.forEach(c => c.addEventListener('click', event => {
        // Find out which colour span was clicked and set the appropriate colour value
        const colour = PALETTE[event.target.dataset.index]
        // Synthesise a button using the colour value selected
        const synthButton = {
            setState,
            style:`${button.style}:${colour}`, 
            element:button.element
        }
        drawer.hide()
        // Apply the new style
        Styles.click( editor, synthButton )
    }))
}


/**
 * Mandatory button click function which displays the colour dialogue
 * for the supplied button
 * @param {object} edt A unique editor instance
 * @param {object} btn The button to act on
 */
const click = function( edt, btn ){
    // Ignore if a modal is active
    if ( drawer && drawer.active() ){
        return
    }
    editor = edt
    button = btn
    if ( editor.range === false || editor.range.collapsed ){
        const feedback = new Modal({
            type:'overlay',
            severity:'info',
            html:'The colour selection buttons require at least one character to be selected.',
            buttons: { cancel: {label:'Close'} }
        })
        feedback.show()
        return
    }
    show(editor, btn)
}

/**
 * Set the disabled and active states of a button
 * @param {object} edt An editor instance
 * @param {object} btn The button to act on
 */
const setState = function(edt,btn){
    //console.log('setting colour state ')
    btn.element.disabled = edt.range===false || 
                           edt.range.collapsed ||
                           edt.range.rootNode == edt.editorNode || 
                           Helpers.isList(edt.range.rootNode)
    // Get the inline styles of the selected range
    let value = ''
    let styles = []
    const inlineStyles = edt.range.startContainer.parentNode.getAttribute('style')
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

const init = function(editor, button){
    // console.log('Initialising colour button',button.tag)
    const bar = document.createElement('span')
    bar.classList.add('bar')
    bar.classList.add(button.tag)
    button.element.appendChild(bar)
    button.element.classList.add('barred')
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

let options = {init, setState, style:'color'}
export const FOREGROUND = new ToolbarButton( 'inline', 'FGC', 'Text colour', Icons.colourForeground, click, options)

options = {init, setState, style:'background-color'}
export const BACKGROUND = new ToolbarButton( 'inline', 'BGC', 'Highlight colour', Icons.colourBackground, click, options)