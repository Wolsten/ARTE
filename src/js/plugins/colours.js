import * as Helpers from '../helpers.js'
import * as Styles from './styles.js'
import * as Icons from '../icons.js'
import ToolbarButton from '../ToolbarButton.js'
import Modal from '../Modal.js'

const PALETTE = ['black','white','violet','indigo','blue','green','yellow','orange','red']
let drawer = null

/**
 * Construct the colour dialogue
 * @param {object} button 
 * @returns 
 */
function form(){
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
 * Show the colour input for the button supplied, saving in the global input 
 * variable.
 * The input is not displayed but triggered programmatically to display
 * a HTML5 colour input dialogue. 
 * Clicking on this triggers the input event.
 */
function show(editor,button){
    let title = "Select highlight colour"
    if ( button.tag == 'ARTE-COLOR'){
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
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
const click = function( editor, button ){
    // Ignore if a modal is active
    if ( drawer && drawer.active() ){
        return
    }
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
    show(editor, button)
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
export const FOREGROUND = new ToolbarButton( 'inline', 'ARTE-COLOR', 'Text colour', Icons.colourForeground, click, options)

options = {init, setState, style:'background-color'}
export const BACKGROUND = new ToolbarButton( 'inline', 'ARTE-BACKGROUND-COLOR', 'Highlight colour', Icons.colourBackground, click, options)