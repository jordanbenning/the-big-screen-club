import type { CSSProperties } from 'react'

interface InlineAlertProps {
  type: 'success' | 'error'
  message: string
  onDismiss: () => void
}

function InlineAlert({ type, message, onDismiss }: InlineAlertProps) {
  const baseStyle: CSSProperties = {
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    border: '1px solid',
    animation: 'slideDown 0.3s ease-out',
  }

  const successStyle: CSSProperties = {
    ...baseStyle,
    backgroundColor: '#d4edda',
    color: '#155724',
    borderColor: '#c3e6cb',
  }

  const errorStyle: CSSProperties = {
    ...baseStyle,
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderColor: '#f5c6cb',
  }

  const buttonStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: 'inherit',
    padding: '0 0 0 12px',
    lineHeight: '1',
    fontWeight: 'bold',
  }

  return (
    <div style={type === 'success' ? successStyle : errorStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
          {type === 'success' ? '✓' : '✕'}
        </span>
        <span>{message}</span>
      </div>
      <button
        onClick={onDismiss}
        style={buttonStyle}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  )
}

export default InlineAlert
