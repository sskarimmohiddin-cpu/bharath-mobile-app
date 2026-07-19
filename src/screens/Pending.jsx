import React from 'react';
import JobCard from '../components/JobCard';

const Pending = ({ jobs, jobParts, onEditJob, onDeleteJob, onMarkDelivered, onCollectBalance, onMarkReturned, onCollectAdvance, onOpenPayments }) => {
  const pendingJobs = jobs.filter(j => j.status === 'Pending' || j.status === 'Partial');

  const [search, setSearch] = React.useState('');
  const filteredPending = pendingJobs.filter(j =>
    search === '' ||
    (j.customer_name && j.customer_name.toLowerCase().includes(search.toLowerCase())) ||
    (j.device_model && j.device_model.toLowerCase().includes(search.toLowerCase())) ||
    (j.job_id && j.job_id.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>Pending Jobs</div>
      <div style={{ fontSize: 13, color: '#999', marginBottom: 10 }}>{pendingJobs.length} jobs pending</div>
      <input
        type='text'
        placeholder='🔍 Search by name, model, job ID...'
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', marginBottom: 16 }}
      />

      {pendingJobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#2e7d32' }}>All jobs delivered!</div>
          <div style={{ fontSize: 13, color: '#999', marginTop: 6 }}>No pending jobs right now.</div>
        </div>
      )}

      {/* PARTIAL PAYMENT JOBS */}
      {filteredPending.filter(j => j.status === 'Partial').length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 8, background: '#fff3e0', padding: '6px 12px', borderRadius: 8 }}>
            💰 Partial Payment — Balance Pending ({pendingJobs.filter(j => j.status === 'Partial').length} jobs)
          </div>
          {pendingJobs.filter(j => j.status === 'Partial').map((job, i) => (
            <JobCard key={i} job={job} jobParts={jobParts}
              onEdit={onEditJob} onDelete={onDeleteJob}
              onMarkDelivered={onMarkDelivered}
              onCollectBalance={onCollectBalance}
              onMarkReturned={onMarkReturned}
              onCollectAdvance={onCollectAdvance}
              onOpenPayments={onOpenPayments}
            />
          ))}
        </div>
      )}

      {/* PENDING JOBS */}
      {pendingJobs.filter(j => j.status === 'Pending').length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: '#f57c00', marginBottom: 8, background: '#fff8e1', padding: '6px 12px', borderRadius: 8 }}>
            🔧 Under Repair ({pendingJobs.filter(j => j.status === 'Pending').length} jobs)
          </div>
          {pendingJobs.filter(j => j.status === 'Pending').map((job, i) => (
            <JobCard key={i} job={job} jobParts={jobParts}
              onEdit={onEditJob} onDelete={onDeleteJob}
              onMarkDelivered={onMarkDelivered}
              onCollectBalance={onCollectBalance}
              onMarkReturned={onMarkReturned}
              onCollectAdvance={onCollectAdvance}
              onOpenPayments={onOpenPayments}
            />
          ))}
        </div>
      )}

      {/* SUMMARY */}
      {pendingJobs.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, padding: 16, marginTop: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>Summary</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: '#555' }}>Total Pending Jobs</div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#f57c00' }}>{pendingJobs.length}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: '#555' }}>Total Job Value</div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1a73e8' }}>Rs.{pendingJobs.reduce((s, j) => s + Number(j.price || 0), 0)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: '#555' }}>Balance to Collect</div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#c62828' }}>Rs.{pendingJobs.reduce((s, j) => s + Number(j.balance || 0), 0)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pending;