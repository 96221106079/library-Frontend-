const BookSkeleton = () => (
  <div style={{
    background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.04)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column'
  }}>
    <style>{`
      @keyframes pulse {
        0% { opacity: 0.3; }
        50% { opacity: 0.6; }
        100% { opacity: 0.3; }
      }
      .skel-shimmer {
        background: rgba(0, 0, 0, 0.04);
        animation: pulse 1.5s ease-in-out infinite;
      }
    `}</style>
    <div className="skel-shimmer" style={{ width: '100%', paddingTop: '100%' }} />
    <div style={{ padding: '12px' }}>
      <div className="skel-shimmer" style={{ height: '14px', width: '80%', borderRadius: '4px', marginBottom: '8px' }} />
      <div className="skel-shimmer" style={{ height: '12px', width: '50%', borderRadius: '4px', marginBottom: '16px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div className="skel-shimmer" style={{ height: '16px', width: '30%', borderRadius: '4px' }} />
        <div className="skel-shimmer" style={{ height: '12px', width: '20%', borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div className="skel-shimmer" style={{ flex: 1, height: '32px', borderRadius: '8px' }} />
        <div className="skel-shimmer" style={{ flex: 1, height: '32px', borderRadius: '8px' }} />
      </div>
    </div>
  </div>
);

export default BookSkeleton;
