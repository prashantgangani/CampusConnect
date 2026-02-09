import React, { useEffect, useState } from 'react';
import jobService from '../../services/jobService';
import './Dashboard.css';

const JobList = () => {
	const [jobs, setJobs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchJobs = async () => {
		try {
			setLoading(true);
			const data = await jobService.getAllJobs();
			setJobs(data.jobs || []);
		} catch (err) {
			setError(err?.message || 'Failed to load jobs');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchJobs();
	}, []);

	if (loading) return <div className="jobs-container">Loading jobs...</div>;
	if (error) return <div className="jobs-container">Error: {error}</div>;

	return (
		<div className="jobs-container">
			<h2>Active Jobs</h2>
			{jobs.length === 0 && <p>No active jobs available.</p>}
			<ul className="job-list">
				{jobs.map((job) => (
					<li key={job._id} className="job-card">
						<h3>{job.title}</h3>
						<p><strong>Company:</strong> {job.company?.name || '—'}</p>
						<p><strong>Location:</strong> {job.location}</p>
						<p>{job.description}</p>
						<p><strong>Type:</strong> {job.jobType} &nbsp; <strong>Salary:</strong> {job.salary || '—'}</p>
						<p><strong>Skills:</strong> {(job.skills || []).join(', ')}</p>
						<p><small>Posted: {new Date(job.createdAt).toLocaleString()}</small></p>
					</li>
				))}
			</ul>
		</div>
	);
};

export default JobList;

