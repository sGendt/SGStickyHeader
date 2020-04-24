// TODO SGE créer un package npm

/**
 * Crée une instance SGStickyHeader.
 *
 * Ecoute l'événement scroll et transforme un header en position sticky.
 *
 * @author Sébastien GENDT <sg@gendt.fr>
 * @copyright Sébastien GENDT 2019
 * @version 0.0.1
 * @constructor
 * @this {SGStickyHeader}
 * @param {Object} param Une liste de paramètres permettant de configurer le comportement de la classe.
 */
class SGStickyHeader {
    /**
     * Contiendra les configurations de l'objet
     * @access private
     * @type {object}
     */
    #config
    /**
     * Configurations par défaut de la classe
     * @access private
     * @type {object}
     */
    #defaultConfig = {
        target : '.sg-sticky-header',
        stickyStart : 0,
        offsetStart : 0,
        hidden : true,
        elementOnOver : [
            /*'.sg-price-tabs-discount-code',
            '#paragraphe',*/
        ],
        onOffsetY : [
            /*500,
            1500,
            2500,*/
        ],
    }
    /**
     * Nombre de pixel à parcourir avant de recalculer l'état du header
     * @access private
     * @type {number}
     */
    #delta = 5
    /**
     * Indique si la page a effectué un scroll
     * @access private
     * @type {boolean}
     */
    #didScroll
    /**
     * Indique la dernière position de la page
     * @access private
     * @type {number}
     */
    #lastScrollTop = 0
    /**
     * Indique la hauteur du header
     * @access private
     * @type {number}
     */
    #navbarHeight
    /**
     * Contient l'objet DOM du header
     * @access private
     * @type {object}
     */
    #target
    /**
     * Contient les événements personnalisés qui permettront de jouer les callbacks
     * @access private
     * @type {object}
     */
    #callbacks = {
        start : null,
        end : null,
        over : null,
    }
    /**
     * Indique le dernier état du header
     * @access private
     * @type {string}
     */
    #lastStateSticky
    /**
     * Indique le dernier élément survolé
     * @access private
     * @type {string}
     */
    #lastElementOver
    /**
     * Indique le dernière position CSS du header
     * @access private
     * @type {string}
     */
    #lastHeaderPosition
    /**
     * Indique le dernier position Y qui a eu lieu
     * @access private
     * @type {string}
     */
    #lastOffsetY

    /**
     * Ajouter une classe CSS à l'objet DOM header
     *
     * @access private
     * @param {string} className La classe CSS à ajouter
     * @returns {void}
     */
    #addClass = (className) => {
        if (this.#target.classList)
            this.#target.classList.add(className)
        else
            this.#target.className += ` ${className}`
    }


    /**
     * Manage des événements
     *
     * Créer des événements personnalisé et déclenche l'écouteur sur l'événement scroll
     *
     * @returns {void}
     */
    #eventManager = () => {
        /**
         * Sticky header start event.
         *
         * @event SGStickyHeader#SG-sticky-header-start - est déclenché lorsque que le header
         * devient sticky
         * @type {object}
         * @property {string} typeArg - representing the name of the event
         * @property {object} [customEventInit] - dictionary
         * @property {object} [customEventInit[].detail] - Donne des informations complétaires sur l'événement
         * @property {object} [customEventInit[].detail[].header] - Contient l'objet DOM du header
         */
        this.#callbacks.start = new CustomEvent(
            'SG-sticky-header-start',
            { detail: { header : this.#target} }
        )
        /**
         * Sticky header end event.
         *
         * @event SGStickyHeader#SG-sticky-header-end - est déclenché lorsque le header n'est plus sticky
         * @type {object}
         * @property {string} typeArg - representing the name of the event
         * @property {object} [customEventInit] - dictionary
         * @property {object} [customEventInit[].detail] - Donne des informations complétaires sur l'événement
         * @property {object} [customEventInit[].detail[].header] - Contient l'objet DOM du header
         */
        this.#callbacks.end = new CustomEvent(
            'SG-sticky-header-end',
            { detail: { header : this.#target} }
        )
        /**
         * Sticky header over event.
         *
         * @event SGStickyHeader#SG-sticky-header-over - est déclenché lorsque le header passe au dessus d'un élément
         * du DOM
         * @type {object}
         * @property {string} typeArg - representing the name of the event
         * @property {object} [customEventInit] - dictionary
         * @property {object} [customEventInit[].detail] - Donne des informations complétaires sur l'événement
         * @property {object} [customEventInit[].detail[].header] - Contient l'objet DOM du header
         * @property {object} [customEventInit[].detail[].element] - Contient l'objet DOM qui est survolé
         */
        this.#callbacks.over = new CustomEvent(
            'SG-sticky-header-over',
            { detail: { header : this.#target, element : null} }
        )
        /**
         * Sticky header offset y event.
         *
         * @event SGStickyHeader#SG-sticky-header-offset-y - est déclenché lorsque le header atteint une position en y
         * @type {object}
         * @property {string} typeArg - representing the name of the event
         * @property {object} [customEventInit] - dictionary
         * @property {object} [customEventInit[].detail] - Donne des informations complétaires sur l'événement
         * @property {object} [customEventInit[].detail[].header] - Contient l'objet DOM du header
         * @property {number} [customEventInit[].detail[].y] - Contient la valeur en y atteinte
         * @property {string} [customEventInit[].detail[].axe] - Contient la direction du scroll : down or up
         */
        this.#callbacks.offsetY = new CustomEvent(
            'SG-sticky-header-offset-y',
            { detail: { header : this.#target, y : null, axe: null} }
        )

        /**
         * Report the throwing of a scroll.
         *
         * @param {window:addEventListener~event:scroll} e - A scroll event.
         * @listens window:addEventListener~event:scroll
         */
        window.addEventListener("scroll", (e) => {
            this.#didScroll = true

            let st = this.#getScrollTop()

            this.#isOver(st)
            this.#isOffsetY(st)

            if (st > this.#lastScrollTop && st > this.#config.stickyStart){
                if(this.#lastHeaderPosition != 'fixed') {
                    this.#lastHeaderPosition = this.#target.style.position = 'fixed'
                    document.body.style.paddingTop = `${this.#getOuterHeight()}px`
                }
            } else {
                // Scroll Up
                if(st < this.#config.stickyStart) {
                    if(this.#lastHeaderPosition != 'relative') {
                        this.#lastHeaderPosition = this.#target.style.position = 'relative'
                        document.body.style.paddingTop = 0
                    }
                }
            }
        })
    }

    /**
     * Déclenche un événement personnalisé.
     *
     * @access private
     * @param {string} type Nom de l'événement personnalisé
     * @returns {void}
     */
    #eventTrigger = (type) => {
        document.dispatchEvent(this.#callbacks[type])
    }

    /**
     * Retourne le nombre de pixel scrollé verticalement.
     *
     * @access private
     * @returns {number} le nombre de pixel scrollé
     */
    #getScrollTop = () => document.body.scrollTop || document.documentElement.scrollTop

    /**
     * Retourne la hauteur de l'objet DOM header.
     *
     * @access private
     * @returns {number} le nombre de pixel de haut
     */
    #getOuterHeight = () => this.#target.offsetHeight

    /**
     * Détermine si le scroll va vers le haut ou vers le bas selon les configurations de l'instance.
     *
     * @access private
     * @returns {boolean|void}
     */
    #hasScrolled = () => {
        let st = this.#getScrollTop()
        if(Math.abs(this.#lastScrollTop - st) <= this.#delta)
            return false

        let offsetHidden = (this.#config.offsetStart > this.#navbarHeight) ? this.#config.offsetStart : this.#navbarHeight
        if (st > this.#lastScrollTop && st > offsetHidden){
            // Scroll Down
            if(this.#config.hidden) {
                this.#removeClass('down')
                this.#addClass('up')
            }
            if(this.#lastStateSticky !== 'start') {
                this.#eventTrigger('start')
                this.#lastStateSticky = 'start'
            }
        } else {
            // Scroll Up
            if(this.#config.hidden && (st + window.innerHeight < document.body.clientHeight)) {
                this.#removeClass('up')
                this.#addClass('down')
            }
            if(st < offsetHidden)
                if(this.#lastStateSticky !== 'end') {
                    this.#eventTrigger('end')
                    this.#lastStateSticky = 'end'
                }
        }

        this.#lastScrollTop = st
    }

    /**
     * Déclenche est événement personnalisé lorsque le sticky header atteint une position en Y
     *
     * @param {number} st Le nombre de pixel scrollé
     * @returns {void}
     */
    #isOffsetY = (st) => {
        if(st == this.#lastScrollTop)
            return

        let BreakException = {}
        let nbEntries = this.#config.onOffsetY.length
        let axe =  (st > this.#lastScrollTop) ? 'd' : 'u'
        try {
            this.#config.onOffsetY.forEach((y, i, a) => {
                if((
                    axe == 'd' &&
                    ((i+1 < nbEntries && st >= y && st <= a[i+1]) ||
                    (i+1 == nbEntries && st >= y))
                )||(
                    axe == 'u' &&
                    ((i && st <= y && st >= a[i-1]) ||
                    (!i && st <= y))
                )) {
                    if(y+axe !== this.#lastOffsetY) {
                        this.#callbacks.offsetY.detail.y = y
                        this.#callbacks.offsetY.detail.axe = axe
                        this.#eventTrigger('offsetY')
                        this.#lastOffsetY = y+axe
                    }
                    throw BreakException
                }
            })
        } catch(e) {
            if (e === BreakException) return true
        }
    }

    /**
     * Déclenche est événement personnalisé lorsque le sticky header passe au-dessus d'un élément du DOM
     *
     * @param {number} st Le nombre de pixel scrollé
     * @returns {void}
     */
    #isOver = (st) => {
        let BreakException = {}
        try {
            this.#config.elementOnOver.forEach((element) => {
                if(st >= element.start && st <= element.end) {
                    if(element.target !== this.#lastElementOver) {
                        this.#callbacks.over.detail.element = element.target
                        this.#eventTrigger('over')
                        this.#lastElementOver = element.target
                    }
                    throw BreakException
                }
            })
        } catch(e) {
            if (e === BreakException) return true
        }

        if(null !== this.#lastElementOver) {
            this.#callbacks.over.detail.element = null
            this.#lastElementOver = null
            this.#eventTrigger('over')
        }
    }

    /**
     * Supprime une classe CSS à l'objet DOM header
     *
     * @access private
     * @param {string} className La classe CSS à supprimer
     * @returns {void}
     */
    #removeClass = (className) => {
        if (this.#target.classList)
            this.#target.classList.remove(className)
        else
            this.#target.className = this.#target
                .className
                .replace(
                    new RegExp(
                        '(^|\\b)' + className.split(' ').join('|') + '(\\b|$)',
                        'gi'
                    ),
                    ' '
                )
    }

    /**
     * Met en forme un tableau d'éléments du DOM pour une utilisation ultérieure
     *
     * Formate la postion en y du début de l'élément, la position en Y de la fin de l'élément et l'objet DOM de
     * l'élément.
     *
     * @returns {void}
     */
    #setupElementOnOver = () => {
        let elements = [],
        bodyRect = document.body.getBoundingClientRect()

        this.#config.elementOnOver.forEach((element) => {
            let elem = document.querySelector(element),
                elemRect = elem.getBoundingClientRect(),
                start = Math.round(elemRect.top - bodyRect.top)
            elements.push({
                start : start,
                end : start + elem.offsetHeight,
                target : element,
            })
        })

        this.#config.elementOnOver = elements
    }

    /**
     * Constructor, Initialise les éléments nécessaires à l'instance de l'objet.
     *
     * @access public
     * @param {object} [params] Les configurations personnalisées pour l'objet
     * @param {string} [params[].target=.sg-sticky-header] Le selecteur CSS permettant d'identifier le header à rendre sticky.
     * @param {number} [params[].offsetStart=0] Le nombre de pixel avant lesquels la classe ne modifie pas le
     * comportement du header.
     * @param {boolean} [params[].hidden=true] Indique si le header doit disparaitre au scroll down.
     */
    constructor(params) {
        // Define configuration and variables
        this.#config = {...this.#defaultConfig, ...params}
        this.#target = document.querySelector(this.#config.target)
        this.#navbarHeight = this.#getOuterHeight()

        // Setup the class requirements
        this.#setupElementOnOver()
        this.#eventManager()

        // Start the listening of the scroll event for sticky header
        setInterval(() => {
            if (this.#didScroll) {
                this.#hasScrolled()
                this.#didScroll = false
            }
        }, 250)
    }
}

export default SGStickyHeader
