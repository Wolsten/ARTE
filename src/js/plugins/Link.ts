/** 
 * Create active links, ie. links which can be edited rather than a normal html. 
 * 
 * File format:
 * <ARTE-LINK id="id" data-href="url" data-label="label" data-display="0|1|2"></ARTE-LINK>
 * 
 * Editor format:
 * <ARTE-LINK id="id" data-label="label" data-display="0|1|2" contenteditable="false" title="Click to edit">
 *      <a href="url">[url|label (url)|label]</a>
 * </ARTE-LINK>
 * 
 * Sidebar format:
 * <article>
 *      <a href="#id">label (url)</a>
 * </article>
 */

import Editor from '../Editor'
import CustomBlock from './CustomBlock'
import * as Icons from '../Icons'
import * as Helpers from '../helpers'
import { Modal, ModalButton, ModalButtonAction, ModalOptionsType } from '../Modal'
import SidebarButton from '../SidebarButton'


export default class CustomLink extends CustomBlock {

    static readonly TAG = 'ARTE-LINK' // The HTMLElement tag as inserted in the dom for this custom node


    constructor(editor: Editor, group: number) {
        super(editor, 'custom', CustomLink.TAG, Icons.link, group)
    }


    /**
     * Show the custom dialogue for new creation or editing
     */
    show(): void {
        const buttons = [
            new ModalButton(ModalButtonAction.Cancel, 'Cancel'),
        ]
        if (this.editFlag) {
            buttons.push(new ModalButton(ModalButtonAction.Delete, 'Delete', this.handleDelete, 'link'))
        } else {
            // Initialise an action as saved to file
            this.node = document.createElement(this.tag)
            if (!this.node) {
                console.error(`Failed to create new ${this.label}`)
                return
            }
            this.node.id = Helpers.generateUid()
            this.setAttribute('contenteditable', 'false')
            this.setAttribute('href', '')
            this.setAttribute('label', '')
            this.setAttribute('display', '0')
        }

        // Create and display the modal panel
        buttons.push(new ModalButton(ModalButtonAction.Confirm, 'Save', this.save))
        const options: ModalOptionsType = {
            focusId: 'href'
        }
        this.drawer = new Modal(`${this.editFlag ? 'Edit' : 'Create'} link`, this.form(), buttons, options)
    }


    /**
     * Generate html for a dialogue to create/edit a link
     * Returns HTML string
     */
    form(): string {
        let openBtn = ''
        const display = this.getAttribute('display')
        const href = this.getAttribute('href')
        const label = this.getAttribute('label')
        // If editing allow user to open the link in a new tab
        if (this.editFlag) {
            openBtn = ` (<a href="${href}" class="link" target="_blank" title="Open link in new tab or window">${Icons.openLink} Open</a>)`
        }
        return `<div class="form-input">
                    <label for="href">URL${openBtn}</label>
                    <input id="href" type="text" class="form-control" placeholder="URL" required value="${href}">
                </div>
                <div class="form-input">
                    <label for="label">Label (optional)</label>
                    <input id="label" type="text" class="form-control" placeholder="Label" value="${label}">
                </div>
                <div class="form-input">
                    <label for="label">Display option</label>
                    <select class="form-control" id="display">
                        <option value="0" ${display == '0' ? 'selected' : ''}>Label only</option>
                        <option value="1" ${display == '1' ? 'selected' : ''}>Link only</option>
                        <option value="2" ${display == '2' ? 'selected' : ''}>Label and link</option>
                    </select>
                </div>`
    }


    /**
    * Save the new or edited custom element
    */
    save(): void {
        if (!this.drawer) {
            console.error('No drawer is displayed')
            return
        }
        // console.log('Save changes')'
        this.setAttributes(['display', 'label', 'href'], this.drawer)
        // Check for inserting new
        if (!this.editFlag) this.insert()
        // Close the modal
        this.drawer.hide()
        // Format the saved action
        this.format(this.template)
        // Update the buffer
        this.editor.updateBuffer()
    }


    /**
     * Template for how the link is presented in the editor
     */
    template(): string {
        const display = this.getAttribute('display')
        const href = this.getAttribute('href')
        const label = this.getAttribute('label')
        let htmlLabel = ''
        switch (display) {
            case '0': htmlLabel = label; break
            case '1': htmlLabel = href; break
            default: htmlLabel = `${label} (${href})`
        }
        return `<button type="button" title="Edit this link">
                    <a href="${href}">${htmlLabel}</a>
                </button>`
    }


    /**
     * Display custom html in the sidebar
     */
    sidebar(): SidebarButton {
        const links = this.editor?.editorNode?.querySelectorAll(Link.TAG)
        let content = ''
        if (links) {
            links.forEach(link => {
                const href = this.getAttribute('href', link)
                const label = this.getAttribute('label', link)
                content +=
                    `<article>
                        <a href="#${link.id}" title="Click to view link in context">
                            ${label} (${href})
                        </a>
                    </article>`
            })
        }
        return new SidebarButton(Icons.link, 'Links', content)
    }

}