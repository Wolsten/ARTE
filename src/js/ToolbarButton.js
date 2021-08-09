"user strict"

class ToolbarButton {

    /**
     * 
     * @param {string} type block|style|buffer|custom
     * @param {string} tag e.g. H1, CUSTOM
     * @param {string} label Generally used as the title of the button but could also be displayed
     * @param {string} icon The icon to use
     * @param {function} click The callback whent he button is clicked
     * @param {*} options Optional methods and properties. May include some or all of:
     *  init                - Initial format of custom component, adding event handlers
     *  setState            - set disabled and active states of the button
     *  style               - For inline styles
     *  removeStyle         - For inline styles
     *  addEventHandlers    - For active components that can be edited/deleted
     *  clean               - To generate clean versions of custom components
     */
    constructor( type, tag, label, icon, click, options ){
        this.type = type
        this.tag = tag
        this.label = label
        this.input = 'button'
        this.icon = icon
        this.click = click  // Undefined for buffer buttons but must be here
        this.element = null // Populated by editor
        // Default setState method (may be overriden in options next)
        this.setState = range => {
            if ( range === false ){
                this.element.disabled = true
            } else {
                this.element.disabled = false
            }
            this.element.classList.remove('active')
        }
        // Optional parameters
        if ( options != undefined ){
            Object.keys(options).forEach( key => {
                this[key] = options[key]
            })
        }
        // console.log('Created new button', this)
    }
}

export default ToolbarButton