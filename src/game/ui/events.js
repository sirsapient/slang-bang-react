// js/ui/events.js - Event logging system
export class EventLogger {
    constructor(maxEvents = 50) {
        this.events = [];
        this.maxEvents = maxEvents;
        this.container = null;
    }
    
    setContainer(element) {
        this.container = element;
        if (this.container) {
            this.render();
        }
    }
    
    add(text, type = 'neutral') {
        const event = {
            text: text,
            type: type,
            timestamp: Date.now(),
            day: window.game?.state.get('day') || 1
        };
        
        this.events.push(event);
        
        // Trim to max events
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }
        
        // Update display if container exists
        if (this.container) {
            this.addEventToDOM(event);
            this.container.scrollTop = this.container.scrollHeight;
        }
    }
    
    addEventToDOM(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = `event ${event.type}`;
        eventDiv.textContent = `Day ${event.day}: ${event.text}`;
        
        this.container.appendChild(eventDiv);
        
        // Remove oldest events if needed
        while (this.container.children.length > this.maxEvents) {
            this.container.removeChild(this.container.firstChild);
        }
    }
    
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        this.events.forEach(event => {
            this.addEventToDOM(event);
        });
        
        this.container.scrollTop = this.container.scrollHeight;
    }
    
    getHTML() {
        return this.events.map(event => 
            `<div class="event ${event.type}">Day ${event.day}: ${event.text}</div>`
        ).join('');
    }
    
    clear() {
        this.events = [];
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
    
    getRecentEvents(count = 10) {
        return this.events.slice(-count);
    }
}