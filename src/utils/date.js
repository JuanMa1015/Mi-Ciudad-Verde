function formatDateExport(createdAt) {
  if (!createdAt) return '';
  // Firestore Timestamp
  if (createdAt.toDate && typeof createdAt.toDate === 'function') {
    const d = createdAt.toDate();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ` +
           `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  // epoch en segundos
  if (typeof createdAt === 'number' && createdAt < 1e12) {
    const d = new Date(createdAt * 1000);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ` +
           `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  // epoch en milisegundos
  if (typeof createdAt === 'number') {
    const d = new Date(createdAt);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ` +
           `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  // string ya formateada
  if (typeof createdAt === 'string') return createdAt;
  return '';
}
