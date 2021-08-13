import * as Helpers from '../helpers.js'
import * as Styles from './styles.js'
import * as Icons from '../icons.js'
import ToolbarButton from '../ToolbarButton.js'

const DIVISIONS = 20
const H_INC = 360 / DIVISIONS
const S_INC = 100 / DIVISIONS
const L_INC = 100 / DIVISIONS
let hue
let saturation
let lightness
let panel = null

/**
 * Set the colours in the colours dialogue according to the curerntly selected
 * hue, saturation and lightness values
 */
function colourise(){
    const hues = panel.querySelectorAll('.colours .hues span')
    hues.forEach( (item,i) => {
        const h = i * H_INC
        item.style.backgroundColor = `hsl(${h},100%,50%)`
        if ( h == hue ){
            item.classList.add('active')
        } else {
            item.classList.remove('active')
        }
    })
    const saturations = panel.querySelectorAll('.colours .saturations span')
    saturations.forEach( (item,i) => {
        const s = i * S_INC
        item.style.backgroundColor = `hsl(${hue},${s}%,50%)`
        if ( s == saturation ){
            item.classList.add('active')
        } else {
            item.classList.remove('active')
        }
    })
    const lightnesses = panel.querySelectorAll('.colours .lightnesses span')
    lightnesses.forEach( (item,i) => {
        const l = i * L_INC
        item.style.backgroundColor = `hsl(${hue},50%,${l}%)`
        if ( l == lightness ){
            item.classList.add('active')
        } else {
            item.classList.remove('active')
        }
    })
    panel.querySelector('form .result span').style.backgroundColor = `hsl(${hue},${saturation}%,${lightness}%)`
}


/**
 * Construct the colour dialogue
 * @param {object} button 
 * @returns 
 */
function form(button){
    let hues = ''
    let saturations = ''
    let lightnesses = ''
    let title = "Choose a background colour"
    if ( button.tag == 'FGC'){
        title = "Choose a foreground colour"
    }
    for( let i=0; i<DIVISIONS; i++ ){
        hues += `<span class="colour" data-colour="hue" data-index="${i}">&nbsp;</span>`
        saturations += `<span class="colour" data-colour="saturation" data-index="${i}">&nbsp;</span>`
        lightnesses += `<span class="colour" data-colour="lightness" data-index="${i}">&nbsp;</span>`
    }
    return `
        <div class="edit-panel-container">
        <div class="edit-panel-header">
            <h3 class="edit-panel-title">${title}</h3>
        </div>
        <div class="edit-panel-body" id="colour-menu">
            <form>
                <div class="colours">
                    <div class="hues">
                        <label>Hue</label>
                        <div>${hues}</div>
                    </div>
                    <div class="saturations">
                        <label>Saturation</label>
                        <div>${saturations}</div>
                    </div>
                    <div class="lightnesses">
                        <label>Lightness</label>
                        <div>${lightnesses}</div>
                    </div>
                </div>

                <div class="result">
                    <label>Result</label>
                    <span>&nbsp;</span>

                    <div class="buttons">
                        <button type="button" class="cancel">Cancel</button>
                        <button type="submit" class="save">Set</button>
                    </div>
                </div>
            </form>

        </div>`
}

/**
 * Hide the dialogue with transition
 */
 function hide(){
    panel.classList.remove('show')
    setTimeout( ()=>{
        panel.remove()
        panel = null
    }, 500)
}

/**
 * Save the currently selected colour values
 * @param {object} editor 
 * @param {object} button 
 */
function save(editor,button){
    const colour = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    // Synthesise a button using the colour value selected
    const synthButton = {
        setState,
        style:`${button.style}:${colour}`, 
        removeStyle:button.removeStyle, 
        element:button.element
    }
    // Apply the new style
    Styles.click( editor, synthButton )
    hide()
}

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
    // Only allow one at a time
    if ( document.getElementById('colour-menu') != null ){
        return
    }
    // Set initial colours
    hue = 0
    saturation = (DIVISIONS-1) * S_INC
    lightness = 50
    // Create the panel
    panel = document.createElement('DIV')
    panel.id = 'custom-edit'
    panel.classList.add('edit-panel')
    panel.innerHTML = form( button )
    // Handle button events
    panel.querySelector('button.cancel').addEventListener('click', hide )
    panel.querySelector('form').addEventListener('submit', event => {
        event.preventDefault()
        save(editor, button)
    })
    // Add to dom
    document.querySelector('body').appendChild(panel)
    // Apply colours
    colourise()
    // Add click handlers
    const colours = panel.querySelectorAll('span.colour')
    colours.forEach(c => c.addEventListener('click', event => {
        // Find out which colour span was clicked and set the appropriate colour value
        const item = event.target
        const colour = item.dataset.colour
        const index = item.dataset.index
        switch ( colour ){
            case 'hue':
                hue = index * H_INC
                break
            case 'saturation':
                saturation = index * S_INC
                break
            case 'lightness':
                lightness = index * L_INC 
                break
        }
        colourise()
    }))
    // Add show class to display with transition
    setTimeout( ()=>panel.classList.add('show'), 10 )
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