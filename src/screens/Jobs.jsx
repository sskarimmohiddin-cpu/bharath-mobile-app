import React from 'react';
import JobCard from '../components/JobCard';

const Jobs = ({ jobs, jobParts, filterDate, setFilterDate, onEditJob, onDeleteJob, onMarkDelivered, onCollectBalance, onMarkReturned, onCollectAdvance }) => {
  const [search, setSearch] = React.useState('');
  const filtered = jobs.filter(j => {
    const dateMatch = filterDate ? (j.created_at && j.created_at.startsWith(filterDate)) : true;
    const searchMatch = search === '' ||
      (j.customer_name && j.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (j.device_model && j.device_model.toLowerCase().includes(search.toLowerCase())) ||
      (j.job_id && j.job_id.toLowerCase().includes(search.toLowerCase()));
    return dateMatch && searchMatch;
  });

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>All Jobs</div>
      <div style={{ marginBottom: 12 }}>
        <input type='date' value={filterDate} onChange={e => setFilterDate(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box', marginBottom: 8 }} />
        <button onClick={() => setFilterDate('')}
          style={{ width: '100%', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer' }}>
          Show All Jobs
        </button>
        <input type='text' placeholder='🔍 Search by name, model, job ID...'
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', marginTop: 8 }} />
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>No jobs found.</div>
      )}
      {filtered.map((job, i) => (
        <JobCard key={i} job={job} jobParts={jobParts}
          onEdit={onEditJob}
          onDelete={onDeleteJob}
          onMarkDelivered={onMarkDelivered}
          onCollectBalance={onCollectBalance}
          onMarkReturned={onMarkReturned}
          onCollectAdvance={onCollectAdvance}
        />
      ))}
    </div>
  );
};

export default Jobs;