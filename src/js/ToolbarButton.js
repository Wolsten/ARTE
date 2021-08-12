class ToolbarButton {

    /**
     * Constructor for a toolbar button
     * @param {string} type block|style|buffer|custom
     * @param {string} tag As inserted in the dom. e.g. H1, CUSTOM
     * @param {string} label Generally used as the title of the button but could also be displayed
     * @param {string} icon The icon to use
     * @param {function} click The callback invoked when the button is clicked
     * @param {object} options Optional methods. May include some or all of:
     *  init                - Initial format of custom component, adding event handlers
     *  setState            - set disabled and active states of the button
     *  style               - For inline styles, see plugins styles.js and colours.js
     *  removeStyle         - Ditto
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
        // Optional parameters
        if ( options != undefined ){
            Object.keys(options).forEach( key => {
                this[key] = options[key]
            })
        }
    }
}

export default ToolbarButton