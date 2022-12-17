

class Options {

    // Automatically number headings using outline numbering. Allowed values true or false   
    // If include the ARTE.Options.BUTTON in the toolbar then this value can be set by the user     
    headingNumbers = true

    // Styling theme
    // If include the ARTE.Options.BUTTON in the toolbar then this value can be set by the user   
    theme = 'theme-light'

    // Number of Undo operations supported, max 10
    bufferSize = 10

    // Max possible (overrides user option)
    MAX_BUFFER_SIZE = 10

    // Show explorer sidebar? (should be true for testing)
    explorer = true

    // debugging flag, e.g. to output selection ranges
    debug = false

    // Add default content from separate file
    // The option will attempt to read in this file and 
    // override any value for the initial content specified 
    // by the second parameter when creating the editor instance
    // @todo Comment out default content when running test scripts
    defaultContent = ''


    constructor(userOptions: string = '') {
        if (userOptions) {
            const options = userOptions.split(',')
            options.forEach(option => {
                const parts = option.split('=')
                if (parts.length === 2) {
                    const name = parts[0]
                    const value = parts[1].toLowerCase()
                    switch (name) {
                        case 'headingNumbers':
                            this.headingNumbers = value === 'true' ? true : false
                            break
                        case 'bufferSize':
                            this.bufferSize = value === '' ? this.bufferSize : Math.max(parseInt(value), this.MAX_BUFFER_SIZE)
                            break;
                        case 'debug':
                            this.debug = value === 'true' ? true : false
                            break
                        case 'defaultContent':
                            this.defaultContent = value
                            break
                        case 'explorer':
                            this.explorer = value === 'true' ? true : false
                    }
                }
            })
        }
    }
}


export default Options