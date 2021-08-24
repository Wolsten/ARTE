
describe('Tests block formatting', function () {

    it('tests creating content and changing block formatting', function(){
        cy.arte_open()
        cy.arte_edit()
        cy.arte_type('This is the main heading at level 1')
        cy.get('button#H1').click()

    })

})