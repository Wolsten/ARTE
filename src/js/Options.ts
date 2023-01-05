

export type OptionsType = {
    headingNumbers?: boolean
    theme?: string
    bufferSize?: number
    explorer?: boolean
    debug?: boolean
    defaultContent?: string
    people?: string[]
}


export class Options {

    // Automatically number headings using outline numbering. Allowed values true or false   
    // If include the ARTE.Options.BUTTON in the toolbar then this value can be set by the user     
    headingNumbers = true

    // Styling theme
    // If include the ARTE.Options.BUTTON in the toolbar then this value can be set by the user   
    theme = 'theme-light'

    // Number of Undo operations supported, max 10
    bufferSize = 10

    // Max possible (overrides user option)
    readonly MAX_BUFFER_SIZE = 10

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

    // People, things that may be referenced in mentions
    people: string[] = []


    constructor(options?: OptionsType) {

        if (options) {
            if (options.headingNumbers) this.headingNumbers = options.headingNumbers
            if (options.bufferSize) this.bufferSize = options.bufferSize
            if (options.debug) this.debug = options.debug
            if (options.defaultContent) this.defaultContent = options.defaultContent
            if (options.explorer) this.explorer = options.explorer
            if (options.people) this.people = options.people
        }
    }
}