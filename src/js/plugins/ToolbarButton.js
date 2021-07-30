class ToolbarButton {

    constructor( type, tag, label, icon, click, options ){
        this.type = type
        this.tag = tag
        this.label = label
        this.input = 'button'
        this.icon = icon
        this.click = click  // Undefined for buffer buttons but must be here
        this.element = null // Populated by editor
        this.group = type
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
        console.log('Created new button', this)
        // if ( options != undefined ){
        //     if ( options.init != undefined ){
        //         this.init = options.init
        //     }
        //     if ( options.disabled != undefined ){
        //         this.disabled = options.disabled
        //     }
        //     if ( options.shortcut != undefined ){
        //         this.shortcut = options.shortcut
        //     }
        //     if ( options.addEventHandlers != undefined ){
        //         this.addEventHandlers = options.addEventHandlers
        //     }
        //     if ( options.clean != undefined ){
        //         this.clean = options.clean
        //     }
        //     if ( options.input != undefined ){
        //         this.input = options.input
        //     }
        //     if ( options.group != undefined ){
        //         this.group = options.group
        //     }
        //     if ( options.changed != undefined ){
        //         this.changed = options.changed
        //     }
        // }
    }
}

export default ToolbarButton