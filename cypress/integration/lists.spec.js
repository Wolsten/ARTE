describe('Tests block plugin - lists', function () {

    beforeEach('Open editor url and start editing', function(){
        cy.arte_visit()
    })


    it('1. tests creating numbered list', function(){

        cy.arte_type_format('h1','Numbered list',true)

        cy.arte_print('Numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_count('ol',1)
        cy.arte_count('li',1)

        cy.arte_print('Numbered bullet B')
        cy.arte_count('li',2)

        cy.arte_print('Numbered bullet C')
        cy.arte_count('li',3)
    })


    it('2. test creating unordered lists',function(){

        cy.arte_type_format('h1','Unordered list',true)

        cy.arte_print('Unordered bullet A')
        cy.arte_click_id('UL')
        cy.arte_count('ul',1)
        cy.arte_count('li',1)

        cy.arte_print('Unordered bullet B')
        cy.arte_count('li',2)

        cy.arte_print('Unordered bullet C')
        cy.arte_count('li',3)
    })


    it('3. tests creating and changing list type from ordered to unordered', function(){
        
        cy.arte_type_format('h1','Numbered to unordered list',true)

        cy.arte_print('Was numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_count('ol',1)
        cy.arte_count('li',1)

        cy.arte_print('Was numbered bullet B')
        cy.arte_count('li',2)

        cy.arte_print('Was numbered bullet C')
        cy.arte_count('li',3)

        cy.arte_set_selection('Was numbered bullet A','Was numbered bullet C')
        cy.arte_click_id('UL')
        cy.arte_count('ul',1)
        cy.arte_count('li',3)
    })


    it('4. tests creating and changing list type from unordered to numbered', function(){
        
        cy.arte_type_format('h1','Unordered to numbered list',true)

        cy.arte_print('Was unordered bullet A')
        cy.arte_click_id('UL')
        cy.arte_count('ul',1)
        cy.arte_count('li',1)

        cy.arte_print('Was unordered bullet B')
        cy.arte_count('li',2)

        cy.arte_print('Was unordered bullet C')
        cy.arte_count('li',3)

        cy.arte_set_selection('Was unordered bullet A','Was unordered bullet C')
        cy.arte_click_id('OL')
        cy.arte_count('ol',1)
        cy.arte_count('li',3)
    })


    it('5. tests creating and indenting lists', function(){

        cy.arte_type_format('h1','3-level indented list',true)

        cy.arte_print('Numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_count('ol',1)
        cy.arte_count('li',1)

        cy.arte_print('Numbered bullet B')
        cy.arte_count('li',2)

        cy.arte_print('Numbered bullet C')
        cy.arte_count('li',3)

        cy.arte_print('Indented unordered bullet C.A')
        cy.arte_click_id('UL')
        cy.arte_count('ol',1)
        cy.arte_count('ul',1)
        cy.arte_count('li',4)

        cy.arte_print('Indented unordered bullet C.B')
        cy.arte_count('li',5)

        cy.arte_print('Indented unordered bullet C.C')
        cy.arte_count('li',6)

        cy.arte_print('Numbered bullet C.C.A')
        cy.arte_click_id('OL')
        cy.arte_count('ol',2)
        cy.arte_count('li',7)

        cy.arte_print('Numbered bullet C.C.B')
        cy.arte_count('li',8)

        cy.arte_print('Numbered bullet C.C.C')
        cy.arte_count('li',9)

        // Check have the correct block styles
        cy.arte_count('h1',1)
        cy.arte_count('ol',2)
        cy.arte_count('ul',1)
    })


    it('6. tests indenting existing lists', function(){

        cy.arte_type_format('h1','Indenting existing list',true)

        cy.arte_print('Numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_count('ol',1)
        cy.arte_count('li',1)

        cy.arte_print('Numbered bullet B')
        cy.arte_count('li',2)

        cy.arte_print('Numbered bullet C')
        cy.arte_count('li',3)

        cy.arte_print('Numbered sub-bullet C.A')
        cy.arte_count('li',4)

        cy.arte_print('Numbered sub-bullet C.B')
        cy.arte_count('li',5)

        cy.arte_print('Numbered sub-bullet C.C')
        cy.arte_count('li',6)

        cy.arte_print('Numbered bullet D')
        cy.arte_count('li',7)

        cy.arte_print('Numbered bullet E')
        cy.arte_count('li',8)

        cy.arte_set_selection('Numbered sub-bullet C.A','Numbered sub-bullet C.C')
        cy.arte_click_id('UL')
        cy.arte_count('ol',1)
        cy.arte_count('ul',1)
        cy.arte_count('h1',1)
        cy.arte_count('li',8)
    })


})