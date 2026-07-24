export function formatDate(dateString, options = {}) {
    if (!dateString) return null;

    const date = new Date(dateString);

    const tanggal = date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        ...options,
    });

    const jam = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).replace('.', ':');

    return `${tanggal} ${jam}`;
}
