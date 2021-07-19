class ToolbarButton {

    constructor( type, tag, label, icon, click, options ){
        this.type = type
        this.tag = tag
        this.label = label
        this.icon = icon
        this.click = click
        this.disabled = this.disabled
        this.element = null // Populated by editor
        // Optional parameters
        if ( options != undefined ){
            if ( options.init != undefined ){
                this.init = options.init
            }
            if ( options.disabled != undefined ){
                this.disabled = options.disabled
            }
            if ( options.shortcut != undefined ){
                this.shortcut = options.shortcut
            }
            if ( options.addEventHandlers != undefined ){
                this.addEventHandlers = options.addEventHandlers
            }
            if ( options.clean != undefined ){
                this.clean = options.clean
            }
        }
    }

    // Default disabled method
    disabled(range){
        if ( range === false ){
            this.element.disabled = true
            this.element.classList.remove('active')
        } else {
            this.element.disabled = false
        }
    }

}

export default ToolbarButton