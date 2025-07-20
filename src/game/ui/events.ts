// js/ui/events.ts - Event logging system (TypeScript)

export type EventType = 'neutral' | 'good' | 'bad' | string;

export interface GameEvent {
  text: string;
  type: EventType;
  timestamp: number;
  day: number;
}

export class EventLogger {
  events: GameEvent[];
  maxEvents: number;
  container: HTMLElement | null;

  constructor(maxEvents: number = 50) {
    this.events = [];
    this.maxEvents = maxEvents;
    this.container = null;
  }

  setContainer(element: HTMLElement | null) {
    this.container = element;
    if (this.container) {
      this.render();
    }
  }

  add(text: string, type: EventType = 'neutral') {
    const event: GameEvent = {
      text: text,
      type: type,
      timestamp: Date.now(),
      day: (window as any).game?.state.get('day') || 1
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

  addEventToDOM(event: GameEvent) {
    if (!this.container) return;
    const eventDiv = document.createElement('div');
    eventDiv.className = `event ${event.type}`;
    eventDiv.textContent = `Day ${event.day}: ${event.text}`;
    this.container.appendChild(eventDiv);
    // Remove oldest events if needed
    while (this.container.children.length > this.maxEvents) {
      this.container.removeChild(this.container.firstChild as ChildNode);
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

  getHTML(): string {
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

  getRecentEvents(count: number = 10): GameEvent[] {
    return this.events.slice(-count);
  }
} 