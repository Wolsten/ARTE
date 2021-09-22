# README.md

![ARTE Rich Text Editor](src/img/logo-medium.png "ARTE logo")

## Description

ARTE (pronounced *Arty*) stands for *Active Rich Text Editor*. Does the world need another WYSIWYG Rich Text Editor? Absolutely! In the course of developing my own applications I became frustrated with those I could find online. First of all I wanted something written in vanilla Javascript that could be embedded easily in any website, independent of framework.

Secondly, and where I struggled most, it should be easy to extend - including the ability to embed "active" content that can be edited using its own dialogue. Such content can then be manipulated separately if required, a good example would be to easily list all comments in a document.

Thirdly, the whole editor needs to be modular, written using plugins so that there is a single implementation pattern. For example, all the standard toolbar buttons are written as block, list, and inline styling plugins.

Fourthly, it cannot use the builtin browser support for contenteditable `execCommand`, since this throws up too many inconsistencies between browsers. Therefore, all dom operations are implemented at a low level, such that where possible, behaviour is consistent across modern browsers.

Lastly, it needs to be open source and free so that there are no commercial drawbacks or lockins to proprietary code that could be difficult to fix. ARTE is written in ES6 but can be built using Webpack and Babel (or your favourite build tool) potentially opening up usage on a wide range of browsers. For my purposes I have initially targetted Chrome and Safari. The following screenshot shows what the editor looks like using its light theme:

![ARTE Rich Text Editor](assets/ARTE-light-theme.png "ARTE Screen shot - light theme")

*Disclaimer*

ARTE has not been tested extensively across a range of browsers and, in particular, touch interfaces have only been tested briefly on mobile Safari on an iPhone. 

## User Guide and Demo

For a full user guide on how to use and customise ARTE please check out our [ARTE wiki](https://github.com/Wolsten/ARTE/wiki).

Try ARTE out here:

[https://wolsten.github.io/ARTE/](https://wolsten.github.io/ARTE/)

## Get involved

Sign up to the ARTE Discord Server:

[ARTE Discord Server](https://discord.gg/y322hmbxGq)

## Acknowledgements

ARTE uses a small number of SVG icons sourced from the Bootstrap Icon library here:

https://icons.getbootstrap.com

### Licence

It is licenced under [MIT](https://opensource.org/licenses/mit-license.php).