import * as Icons from '../Icons'
import ToolbarButton, { ToolbarButtonType } from '../ToolbarButton'
import { Modal, ModalButton, ModalButtonAction, ModalSeverity, ModalType, ModalOptionsType } from '../Modal.js'
import Editor from '../Editor'



export default class File extends ToolbarButton {

    private drawer: Modal | null = null
    private confirm: Modal | null = null
    private filename: string = ''

    constructor(editor: Editor, group: number) {
        super(editor, ToolbarButtonType.DETACHED, 'FILE', 'File', Icons.fileOpen, group)
    }


    setState(): void {
        this.element.classList.add('active')
    }


    /**
     * Mandatory button click function
     */
    click() {
        // Ignore if a modal is active
        if (Modal.active()) {
            return
        }
        this.show()
    }


    /**
     * Show the options dialogue.
     */
    private show() {
        const buttons = [
            new ModalButton(ModalButtonAction.Cancel, 'Close'),
        ]
        const options: ModalOptionsType = {
            escapeToCancel: true,
        }
        this.drawer = new Modal('File options', this.form(), buttons, options)

        // Set custom event handles to update immediately

        // New
        const newButton = document.getElementById('file-new')
        newButton?.addEventListener('click', () => this.clear())

        // Open
        const openButton = document.getElementById('file-open')
        openButton?.addEventListener('click', () => this.upload())

        // Preview
        const previewButton = document.getElementById('file-preview')
        previewButton?.addEventListener('click', () => this.preview())

        // Preview
        const downloadButton = document.getElementById('file-download')
        downloadButton?.addEventListener('click', () => this.download())

    }



    /**
     * Form template
     */
    private form() {
        return `<div class="form-input options">
                    <button type="button" id="file-new">${Icons.clear} New</button>
                    <button type="button" id="file-open">${Icons.fileOpen} Open</button>
                    <button type="button" id="file-preview">${Icons.preview} Preview</button>
                    <button type="button" id="file-preview">${Icons.download} Download</button>
                </div>`
    }


    // -----------------------------------------------------------------------------
    // @section New 
    // -----------------------------------------------------------------------------


    private clear() {
        const html = '<p>Are you sure you want to clear the editor and start a new document? Any changes will be lost.</p>'
        const options = {
            escapeToCancel: true,
            type: ModalType.Overlay,
            severity: ModalSeverity.Warning
        }
        const buttons = [
            new ModalButton(ModalButtonAction.Cancel, 'Cancel'),
            new ModalButton(ModalButtonAction.Confirm, 'Yes', () => this.confirmClear())
        ]
        this.confirm = new Modal('Start new document?', html, buttons, options)
    }

    private confirmClear() {
        this.editor.editorNode.innerHTML = ''
        // this.filename = 'arte-download'
        this.drawer?.hide()
        this.confirm?.hide()
        setTimeout(() => this.editor.updateBuffer(), 100)
    }


    // -----------------------------------------------------------------------------
    // @section Upload
    // -----------------------------------------------------------------------------


    /**
     * Handle file upload from the upload button defined in the upload method
     */
    private handleFileUpload(input: HTMLInputElement): void {
        // console.log('handleFileUpload A')
        const file = input.files ? input.files[0] : null
        if (!file) {
            return
        }
        // console.log('handleFileUpload B')
        const ext = file.name.slice(-4).toLowerCase()
        if (ext !== 'arte') {
            return
        }
        // console.log('handleFileUpload C')
        this.filename = file.name.slice(0, -5)
        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event?.target?.result
            if (!content) {
                console.error()
                return
            }
            this.editor.initEditor(<string>content)
        }
        // console.log('handleFileUpload D')
        reader.readAsText(file)
        // Remove the input (avoids multiple event listeners amongst other things)
        input.remove()
        // Hiding 
        // console.log('Hiding drawer after upload')
        this.drawer?.hide()
    }

    /**
     * Add a hidden file input (if not already done so) and then click it
     * programmatically
     */
    private upload() {
        let input: HTMLInputElement | null = <HTMLInputElement>document.getElementById('arte-upload')
        if (!input) {
            input = <HTMLInputElement>document.createElement('INPUT')
            if (!input) {
                console.error('Could not create file input')
                return
            }
        }
        input.id = 'arte-upload'
        input.type = 'file'
        input.style.display = 'none'
        input.accept = '.arte'
        console.log('input', input.outerHTML)
        input.addEventListener('change', () => this.handleFileUpload(<HTMLInputElement>input), false)
        document.body.appendChild(input)
        input.click()
    }



    // -----------------------------------------------------------------------------
    // @section Preview
    // -----------------------------------------------------------------------------


    private preview() {
        // Get the preview from the editor
        let xml = this.editor.getCleanData(true)
        // console.log(xml)
        // Insert line feed before all opening tags to make easier to read
        // xml = xml.replace(/(<[^\/.]+?>)/gm, '\n$1')
        // Instantiate the modal
        const buttons = [new ModalButton(ModalButtonAction.Cancel, 'Close', () => this.cancelPreview())]
        // @todo Why is this a text area?
        // const html = `<textarea style="height:100%;width:100%;padding:2rem;" readonly>${xml}</textarea>`
        const html = `<div class="arte-preview"><textarea>${xml}</textarea></div>`
        const options = {
            type: ModalType.FullScreen,
            escapeToCancel: true,
        }
        this.confirm = new Modal('Cleaned XML to be saved', html, buttons, options)
    }


    private cancelPreview() {
        this.drawer?.hide()
        this.confirm?.hide()
    }



    // -----------------------------------------------------------------------------
    // @section Download
    // -----------------------------------------------------------------------------

    /**
     * Display modal dialogue requesting the filename to download as
     */
    private download(): void {
        const buttons = [
            new ModalButton(ModalButtonAction.Confirm, 'Save', this.save),
            new ModalButton(ModalButtonAction.Cancel, 'Cancel'),
        ]
        const options = {
            escapeToCancel: true
        }
        this.confirm = new Modal('Save file', this.saveTemplate(this.filename), buttons, options)
    }


    private saveTemplate(filename = 'arte-download') {
        //console.log('filename is',filename)
        return `
            <form class="save">
                <p class="advice">Enter the filename without extension. The file will be saved in your <strong>Downloads</strong> folder with the extension <strong>arte</strong>.</>
                <div class="form-input">
                    <input type="text" id="filename" title="filename" class="form-control" placeholder="Filename" required value="${filename}"/>
                </div>
                <p class="feedback"></p>
            </form>`
    }

    /**
     * Add a hidden download button to the dom with the encoded contents of the
     * editor, click it programmatically and then remove
     */
    save(): void {
        const fileInput = document.querySelector('form.save #filename')
        if (!fileInput) {
            console.error('Could not find file input')
            return
        }
        let filename = (<HTMLInputElement>fileInput).value.trim().toLowerCase()
        if (filename == '') {
            const feedback = document.querySelector('form.save .feedback')
            if (!feedback) {
                console.error('Could not find feedback placeholder')
                return
            }
            feedback.innerHTML = "You must provide a filename. Click <strong>Cancel</strong> or press the <strong>Escape</strong> key to close this dialogue without saving."
            return
        }
        filename += '.arte'
        let xml = this.editor.getCleanData()
        const link = document.createElement('a')
        link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(xml))
        link.setAttribute('download', filename)
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        link.remove()
    }


}