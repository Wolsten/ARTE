class Options {

    // Automatically number headings using outline numbering. Allowed values true or false   
    // If include the ARTE.Options.BUTTON in the toolbar then this value can be set by the user     
    headingNumbers = true

    // Styling theme
    // If include the ARTE.Options.BUTTON in the toolbar then this value can be set by the user   
    theme = 'theme-light'

    // Number of Undo operations supported, max 10
    bufferSize = 10

    // Show explorer sidebar? (should be true for testing)
    explorer = true

    // debugging flag, e.g. to output selection ranges
    debug = true

    // Add default content from separate file
    // The option will attempt to read in this file and 
    // override any value for the initial content specified 
    // by the second parameter when creating the editor instance
    // @todo Comment out default content when running test scripts
    defaultContent = 'sample.arte'

}


export default Options