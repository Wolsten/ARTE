describe('Tests list formatting', function () {

    before('Open editor url and start editing', function(){
        cy.arte_visit()
    })

    // after('Screenshot', function(){
    //     cy.screenshot()
    // })

    it('1. tests creating numbered list', function(){
        cy.arte_type('Numbered list')
        cy.arte_click_id('H1')
        cy.arte_print('Numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_print('Numbered bullet B')
        cy.arte_print('Numbered bullet C')

        // Check have the correct block styles
        cy.arte_count('h1',1)
        cy.arte_count('ol',1)
        cy.arte_count('li',3)
    })

    it('2. test creating unordered lists',function(){
        cy.arte_print('Unordered list')
        cy.arte_click_id('H1')
        cy.arte_print('Unordered bullet A')
        cy.arte_click_id('UL')
        cy.arte_print('Unordered bullet B')
        cy.arte_print('Unordered bullet C')

        // Check have the correct block styles
        cy.arte_count('h1',2)
        cy.arte_count('ol',1)
        cy.arte_count('ul',1)
        cy.arte_count('li',6)
    })

    it('3. tests creating and changing list type from ordered to unordered', function(){
        cy.arte_print('Numbered to unordered list')
        cy.arte_click_id('H1')
        cy.arte_print('Was numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_print('Was numbered bullet B')
        cy.arte_print('Was numbered bullet C')
        cy.arte_set_selection('Was numbered bullet A','Was numbered bullet C')
        cy.arte_click_id('UL')

        // Check have the correct block styles
        cy.arte_count('h1',3)
        cy.arte_count('ol',1)
        cy.arte_count('ul',2)
        cy.arte_count('li',9)
    })

    it('4. tests creating and changing list type from unordered to numbered', function(){
        cy.arte_print('Unordered to numbered list')
        cy.arte_click_id('H1')
        cy.arte_print('Was unordered bullet A')
        cy.arte_click_id('UL')
        cy.arte_print('Was unordered bullet B')
        cy.arte_print('Was unordered bullet C')
        cy.arte_set_selection('Was unordered bullet A','Was unordered bullet C')
        cy.arte_click_id('OL')

        // Check have the correct block styles
        cy.arte_count('h1',4)
        cy.arte_count('ol',2)
        cy.arte_count('ul',2)
        cy.arte_count('li',12)
    })

    it('5. tests creating and indenting lists', function(){
        cy.arte_print('3-level indented list')
        cy.arte_click_id('H1')
        cy.arte_print('Numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_print('Numbered bullet B')
        cy.arte_print('Numbered bullet C')
        cy.arte_print('Indented unordered bullet C.A')
        cy.arte_click_id('UL')
        cy.arte_print('Indented unordered bullet C.B')
        cy.arte_print('Indented unordered bullet C.C')
        cy.arte_print('Numbered bullet C.C.A')
        cy.arte_click_id('OL')
        cy.arte_print('Numbered bullet C.C.B')
        cy.arte_print('Numbered bullet C.C.C')

        // Check have the correct block styles
        cy.arte_count('h1',5)
        cy.arte_count('ol',4)
        cy.arte_count('ul',3)
        cy.arte_count('li',21)
    })

    it('6. tests indented existing lists', function(){
        cy.arte_print('Indented existing list')
        cy.arte_click_id('H1')
        cy.arte_print('Numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_print('Numbered bullet B')
        cy.arte_print('Numbered bullet C')
        cy.arte_print('Numbered sub-bullet C.A')
        cy.arte_print('Numbered sub-bullet C.B')
        cy.arte_print('Numbered sub-bullet C.C')
        cy.arte_print('Numbered bullet D')
        cy.arte_print('Numbered bullet E')
        cy.arte_set_selection('Numbered sub-bullet C.A','Numbered sub-bullet C.C')
        cy.arte_click_id('UL')

        // Check have the correct block styles
        cy.arte_count('h1',6)
        cy.arte_count('ol',5)
        cy.arte_count('ul',4)
        cy.arte_count('li',29)
    })


})