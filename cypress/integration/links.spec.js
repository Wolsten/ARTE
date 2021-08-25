describe('Tests links', function () {

    before('Open editor url and start editing', function(){
        cy.arte_visit()
    })

    it('tests entering a link', function(){

        cy.arte_print('This is a paragraph with START END where links can be inserted.')

        cy.arte_set_cursor('END')

        cy.arte_type('www.wibble.com ')

        cy.arte_set_selection('www.wibble.com')

        cy.arte_click_id('A')

        cy.arte_modal_element_type('#href', '{movetoend}www.wibble.com')

        cy.arte_modal_element_click('button.confirm')
    })

    it('tests editing a link', function(){

        // Click the link
        cy.arte_contains('www.wibble.com').click()

        // Change the display type to option 2
        cy.arte_modal_element_get('select').select("2")

        // Save changes
        cy.arte_modal_element_get('button.confirm').click()

        // Check the full link has been updated correctly
        cy.arte_contains('www.wibble.com (http://www.wibble.com/)')
    })


})