import * as Icons from '../icons.js'
// import * as Helpers from '../helpers.js'
import ToolbarButton from '../ToolbarButton.js'
import Modal from '../Modal.js'

// -----------------------------------------------------------------------------
// @section Variables
// -----------------------------------------------------------------------------

/**
 * @constant {string} TAG The HTMLElement tag as inserted in the dom for this custom node
 */
const TAG = 'SETTINGS'


/**
  * @var {Modal} panel The container for the edit dialogue
  */
let drawer = null


// -----------------------------------------------------------------------------
// @section Private methods
// -----------------------------------------------------------------------------

/**
 * Set the heading numbers
 * @param {object} editor
 * @param {boolean} headingNumbers 
 */
function setHeadingNumbers(editor){
    localStorage.setItem('headingNumbers', editor.options.headingNumbers)
    if ( editor.options.headingNumbers ){
        editor.editorNode.classList.add('heading-numbers')
    } else {
        editor.editorNode.classList.remove('heading-numbers')  
    }
}

/**
 * Set a given theme/color-scheme
 * @param {string} theme name
 */
function setTheme(theme) {
    localStorage.setItem('theme', theme)
    document.documentElement.className = theme
}

function setExplorer(editor){
    localStorage.setItem('explorer', editor.options.explorer)
    if ( editor.options.explorer ){
        editor.showSidebar()
    } else {
        editor.hideSidebar()
    }
}

function handleCancel(){
    drawer.hide()
}

/**
 * Show the options dialogue.
 */
function show(editor){
    // Create and display the modal panel
    drawer = new Modal({
        type:'drawer',
        escape:true,
        title:'Options',
        html: 
        form(editor.options), 
        buttons: {
            cancel:  { label:'Close', callback:handleCancel }
        }
    })
    drawer.show()
    const inputs = drawer.panel.querySelectorAll('form input')
    inputs.forEach(input => input.addEventListener('change', event => {
        if ( event.target.name == 'headingNumbers' ){
            editor.options.headingNumbers = event.target.id == 'on'
            setHeadingNumbers(editor)
        } else if ( event.target.name == 'theme' ){
            editor.options.theme = event.target.id
            setTheme(editor.options.theme)
        } else if ( event.target.name == 'explorer' ){
            editor.options.explorer = event.target.id == 'show-explorer'
            setExplorer(editor)
        }
    }))
}

/**
 * Form template
 * @param {object} options 
 * @returns {string} Generated html
 */
function form(options){
    return `
        <form>
            <div class="form-input">
                <label>Heading numbers</label>
                <label>
                    <input name="headingNumbers" id="on" type="radio" class="form-control first" ${options.headingNumbers ? 'checked' : '' }/> On
                </label>
                <label>
                    <input name="headingNumbers" id="off" type="radio" class="form-control" ${!options.headingNumbers ? 'checked' : ''}/> Off
                </label>
            </div>
            <div class="form-input">
                <label>Theme</label>
                <label>
                    <input name="theme" id="theme-light" type="radio" class="form-control first" ${options.theme=='theme-light' ? 'checked' : '' }/> Light
                </label>
                <label>
                    <input name="theme" id="theme-dark" type="radio" class="form-control" ${options.theme=='theme-dark'  ? 'checked' : ''}/> Dark
                </label>
            </div>
            <div class="form-input">
                <label>Explorer</label>
                <label>
                    <input name="explorer" id="show-explorer" type="radio" class="form-control first" ${options.explorer ? 'checked' : '' }/> Show
                </label>
                <label>
                    <input name="explorer" id="hide-explorer" type="radio" class="form-control" ${options.explorer==false ? 'checked' : ''}/> Hide
                </label>
            </div>
        </form>`
}


/**
 * Set the disabled and active states of a button
 * @param {object} edt A unique editor instance
 * @param {object} btn The button to act on
 */
const setState = function( edt, btn ){
    btn.element.disabled = false
}

/**
 * Mandatory button click function
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on (unused)
 */
const click = function( editor, button ){
    // Ignore if a modal is active
    if ( drawer && drawer.active() ){
        return
    }
    show(editor)
}

/**
 * On first load of editor see if have options in local storage, in which case use
 * otherwise default to editor options
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on (unused)
 */
const init = function( editor, button ){
    const theme = localStorage.getItem('theme')
    if ( theme ){
        editor.options.theme = theme
    }
    setTheme(editor.options.theme)
    const headingNumbers = localStorage.getItem('headingNumbers')
    if (localStorage.getItem('headingNumbers') ) {
        editor.options.headingNumbers = headingNumbers
    }
    setHeadingNumbers(editor)
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

const options = {setState, init}
export const BUTTON = new ToolbarButton( 'detached', TAG, 'Preferences', Icons.options, click, options ) 