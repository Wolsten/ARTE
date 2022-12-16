class ToolbarButtonOptions {
    init: null | Function = null // Initial format of custom component, adding event handlers
    setState: null | Function = null // set disabled and active states of the button
    style: null | Function = null // For inline styles, see plugins styles.js and colours.js
    addEventHandlers: null | Function = null // For active components that can be edited/deleted
    clean: null | Function = null // To generate clean versions of custom components
    sidebar: null | Function = null // Generate code to display in sidebar
}


export default ToolbarButtonOptions