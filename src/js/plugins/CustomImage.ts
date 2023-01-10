/** 
 * Insert/edit image tags
 * 
 * File format:
 * <ARTE-IMAGE 
 *  id="id" 
 *  data-src="src" 
 *  data-alt="alt" 
 *  data-caption="caption">
 * </ARTE-IMAGE>
 * 
 * Editor format:
 * <ARTE-IMAGE id="id" data-src="src" data-alt="alt" data-caption="caption" 
 *             contenteditable="false" title="Click to edit">
 *      <img src="src" alt="alt"/>
 *      [<span class="caption">caption</span>]
 * </ARTE-IMAGE>
 * 
 * Sidebar format:
 * <article>
 *      <img id="id" src="url" alt="alt" title="Click to find in document"/>
 *      [<span class="caption">caption</span>]
 * </article>
 */


import * as Icons from '../icons'
import * as Helpers from '../helpers'
import { Modal, ModalButton, ModalButtonAction, ModalOptionsType } from '../Modal'
import SidebarButton from '../SidebarButton'
import Editor from '../Editor'
import CustomBlock from './CustomBlock'




export default class CustomImage extends CustomBlock {

    static readonly TAG = 'ARTE-IMAGE'   // The HTMLElement tag as inserted in the dom for this custom node

    constructor(editor: Editor, group: number) {
        super(editor, CustomImage.TAG, 'Image', Icons.image, group)
    }


    /**
     * Show the custom dialogue for new creation or editing
     */
    show(): void {
        const buttons = [
            new ModalButton(ModalButtonAction.Cancel, 'Cancel'),
        ]
        if (this.editFlag) {
            buttons.push(new ModalButton(ModalButtonAction.Delete, 'Delete', () => this.handleDelete(), 'link'))
        } else {
            // Initialise an action as saved to file
            this.node = document.createElement(this.tag)
            if (!this.node) {
                console.error(`Failed to create new ${this.label}`)
                return
            }
            this.node.id = Helpers.generateUid()
            this.setAttribute('contenteditable', 'false')
            this.setAttribute('src', '')
            this.setAttribute('alt', '')
            this.setAttribute('caption', '')
        }
        // Create and display the modal panel
        buttons.push(new ModalButton(ModalButtonAction.Confirm, 'Save', () => this.save()))
        const options: ModalOptionsType = {
            focusId: 'src'
        }
        this.drawer = new Modal(`${this.editFlag ? 'Edit' : 'Create'} image`, this.form(), buttons, options)
    }


    /**
     * Generate html for a dialogue to create/edit an image tag
     */
    form(): string {
        const src = this.getAttribute('src')
        const caption = this.getAttribute('caption')
        const alt = this.getAttribute('alt')
        return `<p class="advice">Please enter a URL and optional caption for an image file:
                <div class="form-input">
                    <label for="src">URL</label>
                    <input id="src" type="text" class="form-control" placeholder="Source URL" required value="${src}">
                </div>
                <div class="form-input">
                    <label for="caption">Caption</label>
                    <input id="caption" type="text" class="form-control" placeholder="Caption for image" value="${caption}">
                </div>
                <div class="form-input">
                    <label for="alt">Alt text</label>
                    <input id="alt" type="text" class="form-control" placeholder="Alt text for image" value="${alt}">
                </div>`
    }


    /**
     * Save the changes set in the dialogue
     */
    save(): void {
        if (!this.drawer) {
            console.error('No drawer is displayed')
            return
        }
        // console.log('Save changes')
        this.setAttributes(['src', 'caption', 'alt'], this.drawer)
        // Check whether to insert new arte image
        if (!this.editFlag) this.insert()
        this.drawer.hide()
        // Format image and add event handler
        this.format()
        // Update state
        if (this.node) {
            this.editor.range = Helpers.setCursor(this.node, 0)
            this.setState()
            this.editor.updateBuffer()
        }
    }


    /**
     * Template for how the image is presented in the editor
     */
    template(): string {
        const src = this.getAttribute('src')
        const caption = this.getAttribute('caption')
        const alt = this.getAttribute('alt')
        const htmlCaption = caption ? `<span class="caption">${caption}</span>` : ''
        return `<button type="button" title="Edit this image">
                    <img src="${src}" alt="${alt}"/>
                    ${htmlCaption}
                </button>`
    }

    /**
     * Display custom html in the sidebar
     */
    sidebar(): SidebarButton {
        // console.log('Updating image sidebar')
        const elements = this.editor?.editorNode?.querySelectorAll(this.tag)
        let content = ''
        if (elements) {
            elements.forEach(element => {
                const src = this.getAttribute('src', element)
                const caption = this.getAttribute('caption', element)
                const alt = this.getAttribute('alt', element)
                const htmlCaption = caption ? `<span class="caption">${caption}</span>` : ''
                content +=
                    `<article>
                        <a href="#${element.id}">
                            <img src="${src}" alt="${alt}" title="Click to view image in document"/>
                            ${htmlCaption}
                        </a>
                    </article>`
            })
        }
        return new SidebarButton(this.icon, 'images', content)
    }

}