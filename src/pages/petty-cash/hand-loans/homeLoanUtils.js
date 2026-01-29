
const statusConfig = {
    'ISSUED': {label: 'ISSUED', color: '#3b82f6'},
    'PARTIALLY_RECOVERED': {label: 'PARTIALLY RECOVERED', color: '#f59e0b'},
};


export function getHomeLoadStatus(status) {
    if (statusConfig[status]) return statusConfig[status];
    return {
        label: status?.toUpperCase() || 'N/A',
        color: '#6b7280',
        bgColor: '#f3f4f6'
    };
}