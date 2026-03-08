import { API_BASE, http } from './http';
function formatStreamError(raw) {
    try {
        const parsed = JSON.parse(raw);
        return parsed.message ?? raw;
    }
    catch {
        return raw;
    }
}
export async function fetchRules() {
    const response = await http.get('/rules');
    return response.data;
}
export async function createCharacter(payload) {
    const response = await http.post('/characters', payload);
    return response.data;
}
export async function fetchGameState(sessionId) {
    const response = await http.get('/game-state', {
        params: { sessionId },
    });
    return response.data;
}
export async function resetGameState(sessionId) {
    const response = await http.delete('/game-state', {
        params: { sessionId },
    });
    return response.data;
}
export async function streamChat(input) {
    const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
            Accept: 'text/event-stream',
            'Content-Type': 'application/json',
            'x-api-key': input.apiKey,
            'x-base-url': input.baseUrl,
            'x-model': input.model,
        },
        body: JSON.stringify({ sessionId: input.sessionId, message: input.message }),
    });
    if (!response.ok) {
        throw new Error(formatStreamError(await response.text()));
    }
    if (!response.body) {
        throw new Error('流式响应为空');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { value, done } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
            const lines = chunk.split('\n');
            const eventLine = lines.find((line) => line.startsWith('event:'));
            const dataLine = lines.find((line) => line.startsWith('data:'));
            if (!eventLine || !dataLine)
                continue;
            const event = eventLine.replace('event:', '').trim();
            const data = JSON.parse(dataLine.replace('data:', '').trim());
            if (event === 'token')
                await input.onToken(String(data));
            if (event === 'tool')
                await input.onTool(data);
            if (event === 'error')
                throw new Error(data.message ?? 'stream error');
        }
    }
}
