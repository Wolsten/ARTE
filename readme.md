# README.md

![ARTE Rich Text Editor](src/img/logo-medium.png "ARTE logo")


## Introduction

ARTE (pronounced *Arty*) stands for *Active Rich Text Editor*. Does the world need another WYSIWYG Rich Text Editor? Possibily not, but in the course of developing my own applications I became frustrated with those I could find online. First of all I wanted something written in vanilla Javascript that could be embedded easily in any website independent of framework.

Secondly, and where I struggled most, it should be easy to extend - including the ability to embed "active" content that can be edited using its own dialogue.

Thirdly, the whole editor needs to be modular, written using plugins so that there is a single implementation model. For example, all the standard toolbar buttons are written as block, list, and inline styling plugins.

Fourthly, it cannot use the builtin browser support for contenteditable (execCommand), since I found this throws up too many gotchas between browsers. Therefore, all dom operations are implemented at a low level, such that where possible, behaviour is consistent across modern browsers. However, there has been no attempt to abstract away specific input types and therefore, the look and feel of some interactions will be specific to a browser technology, such as when choosing colours with the colours plugin.

Lastly, it needs to be open source and free so that there are no commercial drawbacks or lockins to proprietary code that could be difficult to fix. ARTE is written in ES6 but can be built using Babel and Webpack (or your favourite build tool) potentially opening up usage on a wide range of browsers. For my purposes I have initially targetted Chrome and other modern webkit based browsers.

*Disclaimer*

ARTE is not a production ready app and has not been tested extensively across a range of browsers. It is licenced under MIT and therefore normal caveats apply.

## Usage

To use in development (source) mode, download the src folder files. You can also download the index.html file as a example of how to configure the editor. 

In the head of the page add the following lines in order to pull in the bootstrap icons that we use by default and a simple style sheet:

```
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="./src/css/styles.css">
```

Then add a placeholder div in the body of your html, e.g:

```
<div id="editor"></div>
```

You can also add a button to save the content of the editor:

```
<button type="button" id="save">Save</button>
```

You need a javascript block that looks something like this:

```
<script type="module" charset="utf-8">
    import ARTE from './src/js/ARTE.JS' 
    const target = document.getElementById('editor')
    // Set the initial content to the current content of the editor div
    let content = target.innerHTML
    // Clear any existing content
    target.innerHTML = ''
    // Setup toolbar
    const toolbar = [
        [ ARTE.Blocks.H1, ARTE.Blocks.H2, ARTE.Blocks.H3, ARTE.Blocks.P, ARTE.Blocks.BQ],
        [ ARTE.Blocks.OL, ARTE.Blocks.UL],
        [ ARTE.Styles.B, ARTE.Styles.I, ARTE.Styles.U, ARTE.Colours.FOREGROUND, ARTE.Colours.BACKGROUND, ARTE.Styles.CLEAR],
        [ ARTE.Buffer.UNDO, ARTE.Buffer.REDO ],
        [ ARTE.Mentions.BUTTON, ARTE.Links.BUTTON, ARTE.Custom.BUTTON ]
    ]
    // Setup plugins
    ARTE.Mentions.setup(['David','William', 'Jenny','Sally', 'Sarah', 'Susan','Brian'])
    // Define editor options
    const options = {
        // Automatically number headings using outline numbering. Allowed values 'on', 'off'       
        headingNumbers: 'on', 
        // Number of Undo operations supported, max 10       
        bufferSize: 10     
    }
    // Create editor and add to dom in target position
    const editor = new ARTE.Editor(target, content, toolbar, options)
    // Configure save button
    const save = document.getElementById('save')
    save.addEventListener('click', ()=>{
        const xml = editor.save()
        console.warn('Cleaned editor content:\n'+xml)
        window.alert('Cleaned editor content:\n'+xml)
    })
</script>
```



Followin
`
/public/js/AJE.js
`

To build your own version of ARTE you can use Babel and Webpack as configured in the source here. Alternatively, feel free to use your own build tools based on the source files provided.



## Acknowledgements

I set up my initial build environment setup using these instructions:

https://www.sitepoint.com/es6-babel-webpack/

I ran into issues with use of an older Babel version so updated to latest for webpack from here:

https://babeljs.io/setup#installation

AJE uses a small number of SVG icons sourced from the Bootstrap Icon library here:

https://icons.getbootstrap.com

