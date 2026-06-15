export default function StatusBadge({ status }) {
  const map = {
    pending:   { label: 'Pending',   cls: 'badge-pending'   },
    approved:  { label: 'Approved',  cls: 'badge-approved'  },
    rejected:  { label: 'Rejected',  cls: 'badge-rejected'  },
    cancelled: { label: 'Cancelled', cls: 'badge-cancelled' },
  };
  const { label, cls } = map[status] || { label: status, cls: '' };
  return <span className={`status-badge ${cls}`}>{label}</span>;
}
