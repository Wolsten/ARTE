import Editor from './Editor'
import ToolbarButton from "./ToolbarButton"
import * as Helpers from './helpers'
import Block from "./plugins/Block"
import Style from "./plugins/Style"
import Buffer from "./plugins/Buffer"
import BufferButton from "./plugins/BufferButton"

class Toolbar {

    defaults: string[][] = [
        ['BLOCK.H1', 'BLOCK.H2', 'BLOCK.H3', 'BLOCK.P', 'BLOCK.BQ'],
        ['BLOCK.OL', 'BLOCK.UL'],
        ['STYLE.B', 'STYLE.I', 'STYLE.U', 'STYLE.FOREGROUND', 'STYLE.BACKGROUND', 'STYLE.CLEAR'],
        ['BUFFER.UNDO', 'BUFFER.REDO'],
        ['CUT', 'COPY', 'PASTE'],
        ['Mentions', 'Links', 'Images', 'Comments', 'Actions'],
        ['Settings']
    ]

    buttons: ToolbarButton[] = []

    constructor(editor: Editor, userGroups: string[][]) {

        if (userGroups.length === 0) {
            userGroups = this.defaults
        }

        userGroups.forEach((group, groupIndex) => {

            group.forEach(entry => {

                const parts = entry.split('.')
                const type = parts[0]
                const name = parts[1]

                let button: null | ToolbarButton = null

                switch (type.toUpperCase()) {
                    case 'BLOCK':
                        button = new Block(name)
                        break
                    case 'STYLE':
                        button = new Style(name)
                        break
                    case 'BUFFER':
                        if (!editor.buffer) {
                            editor.buffer = new Buffer(editor)
                        }
                        button = new BufferButton(editor, name)
                        break
                }

                if (button !== null) {
                    button.group = groupIndex
                    button.editor = editor
                    this.buttons.push(button)
                    Helpers.registerTag(button.type, button.tag)
                }
            })
        })
    }

}


export default Toolbar