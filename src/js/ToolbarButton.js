"user strict"

class ToolbarButton {

    constructor( group, type, tag, label, icon, click, options ){
        this.group = group
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