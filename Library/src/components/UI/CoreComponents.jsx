import React from 'react';

// ✨ Skeleton Loader Component
export const Skeleton = ({ width = '100%', height = '24px', count = 1, circle = false, style = {} }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            width,
            height,
            borderRadius: circle ? '50%' : '8px',
            marginBottom: i < count - 1 ? '12px' : '0',
            ...style,
          }}
        />
      ))}
    </>
  );
};

// 🏷️ Badge Component
export const Badge = ({ label = '', variant = 'default', icon = '', size = 'md' }) => {
  const variants = {
    default: { bg: '#475569', text: '#e2e8f0' },
    primary: { bg: 'rgba(99, 102, 241, 0.2)', text: '#a5b4fc' },
    success: { bg: 'rgba(16, 185, 129, 0.2)', text: '#86efac' },
    warning: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
    danger: { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' },
  };

  const sizeClasses = {
    sm: { padding: '4px 8px', fontSize: '11px' },
    md: { padding: '6px 12px', fontSize: '12px' },
    lg: { padding: '8px 16px', fontSize: '13px' },
  };

  const style = variants[variant] || variants.default;
  const sizeStyle = sizeClasses[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: style.bg,
        color: style.text,
        borderRadius: '20px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        ...sizeStyle,
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
};

// ⭐ Rating Component
export const Rating = ({ value = 0, onChange = null, size = 'md', readOnly = true }) => {
  const sizeMap = { sm: 14, md: 18, lg: 24 };
  const starSize = sizeMap[size];

  const handleClick = (rating) => {
    if (!readOnly && onChange) onChange(rating);
  };

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={starSize}
          height={starSize}
          viewBox="0 0 24 24"
          fill={star <= value ? '#f59e0b' : '#475569'}
          stroke="none"
          onClick={() => handleClick(star)}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
};

// 📍 Availability Indicator
export const Availability = ({ status = 'available' }) => {
  const statusStyles = {
    available: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', label: 'Available' },
    requested: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', label: 'Requested' },
    borrowed: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', label: 'Borrowed' },
    rented: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)', label: 'Rented' },
  };

  const style = statusStyles[status] || statusStyles.available;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: style.bg,
        color: style.color,
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
      }}
    >
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: style.color }} />
      {style.label}
    </span>
  );
};

// 🎯 Empty State Component
export const EmptyState = ({ icon = '📚', title = 'No Items', description = '', action = null }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#0f172a' }}>{title}</h3>
      <p style={{ color: '#64748b', marginBottom: action ? '24px' : '0', maxWidth: '300px' }}>{description}</p>
      {action && <button style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: '600',
        cursor: 'pointer',
      }}>{action.label}</button>}
    </div>
  );
};

// ✅ Status Progress Component
export const StatusProgress = ({ steps = [], currentStep = 0 }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: idx <= currentStep ? '#6366f1' : '#334155',
                color: idx <= currentStep ? '#f1f5f9' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '14px',
                marginBottom: '8px',
              }}
            >
              {idx < currentStep ? '✓' : idx + 1}
            </div>
            <span style={{
              fontSize: '11px',
              color: '#334155',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {step}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: '2px',
                backgroundColor: idx < currentStep ? '#10b981' : '#334155',
                margin: '24px 0',
                marginTop: '0',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// 🔔 Notification Badge
export const NotificationBadge = ({ count = 0, variant = 'danger' }) => {
  if (count === 0) return null;



  return (
    <span
      style={{
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: colors[variant],
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '700',
        border: '2px solid #0f172a',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
