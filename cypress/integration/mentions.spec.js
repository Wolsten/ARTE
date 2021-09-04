describe('Tests mentions', function () {

    beforeEach('Open editor url and start editing', function(){
        cy.arte_visit()
    })

    it('tests inserting names using the mentions button by clicking', function(){

        cy.arte_print_check('h1','tests inserting names using the mentions by clicking',true)

        cy.arte_print_check('p', 'This is a paragraph with START END where names can be added.')

        cy.arte_set_cursor('END')

        cy.arte_click_id('MENTION')

        // Click the default selected name Brian
        cy.arte_modal_element_click('li.selected')

        // Check that Brian was inserted correctly
        cy.arte_set_selection('START Brian END')
    })

    it('tests inserting names using the @@ shortcut', function(){

        cy.arte_print_check('h1','tests inserting names using the double @ shortcut',true)

        cy.arte_print_check('p','This is a paragraph with START END where names can be added.')

        cy.arte_set_cursor('END').wait(200)

        cy.arte_type('@@')

        // Click the default selected name Brian
        cy.arte_modal_element_click('li.selected')

        // Check that Brian was inserted correctly
        cy.arte_set_selection('START Brian END')
    })

    it('tests inserting names using the mentions button by entering text', function(){

        cy.arte_print_check('h1','tests inserting names using the mentions button by entering text',true)

        cy.arte_print_check('p', 'This is a paragraph with START END where names can be added.')

        cy.arte_set_cursor('END')

        cy.arte_click_id('MENTION')

        // Click the default selected name Brian
        cy.arte_modal_element_type('input', 'Robin{enter}')

        // Check that Brian was inserted correctly
        cy.arte_set_selection('START Robin END')
    })    

})