import React from 'react';

const JobCard = ({ job, onEdit, onDelete }) => {
  const cardStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  const btnStyle = {
    backgroundColor: '#ffc107',
    color: '#000',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px'
  };

  const deleteBtnStyle = {
    ...btnStyle,
    backgroundColor: '#dc3545',
    color: '#fff'
  };

  return (
    <div style={cardStyle}>
      <h3>{job.title}</h3>
      <p style={{ color: '#777', fontSize: '0.9rem' }}>{job.location}</p>
      <p>{job.description}</p>

      <div style={{ marginTop: '10px' }}>
        <button style={btnStyle} onClick={onEdit}>
          Edit
        </button>

        <button style={deleteBtnStyle} onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default JobCard;
