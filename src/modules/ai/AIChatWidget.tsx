import { useState, useRef, useEffect } from 'react';
import { dispatchAction } from '../../mcp/dispatcher';

export const AIChatWidget = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
        { role: 'assistant', text: 'Hello! I am Lyra. How can I help you edit this video?' }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');

        // Mock AI Logic
        setTimeout(() => {
            let responseText = "I'm not sure how to do that yet.";

            if (userMsg.toLowerCase().includes('add blue')) {
                dispatchAction({
                    type: 'add_clip',
                    payload: {
                        trackId: 'track-1',
                        type: 'code',
                        start: 0,
                        duration: 3000,
                        name: 'Blue Box',
                        content: '<div style="width:100%;height:100%;background:blue;display:flex;align-items:center;justify-content:center;color:white;font-size:2em;">Blue Box</div>'
                    }
                });
                responseText = "I've added a Blue Box clip to the timeline.";
            } else if (userMsg.toLowerCase().includes('play')) {
                dispatchAction({ type: 'play', payload: {} });
                responseText = "Starting playback.";
            } else if (userMsg.toLowerCase().includes('stop') || userMsg.toLowerCase().includes('pause')) {
                dispatchAction({ type: 'pause', payload: {} });
                responseText = "Paused playback.";
            }

            setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
        }, 500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="flex flex-col h-full text-sm">
            {/* Messages */}
            <div
                className="flex-1 p-3 overflow-auto custom-scrollbar flex flex-col gap-3"
                ref={scrollRef}
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className="flex"
                        style={{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                    >
                        <div
                            className="p-3 text-sm"
                            style={{
                                maxWidth: '85%',
                                borderRadius: 'var(--radius-inner)',
                                backgroundColor: msg.role === 'user'
                                    ? 'var(--color-accent)'
                                    : 'var(--color-elevated)',
                                color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)'
                            }}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div
                className="p-3 flex gap-2"
                style={{ borderTop: '1px solid var(--color-border)' }}
            >
                <input
                    className="modern-input flex-1"
                    placeholder="Ask Lyra..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="modern-button"
                    onClick={handleSend}
                >
                    Run
                </button>
            </div>
        </div>
    );
};
