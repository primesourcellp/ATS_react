import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../layout/navbar';
import { reportAPI } from '../../api/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedRecruiterId, setSelectedRecruiterId] = useState('all');
  const [expanded, setExpanded] = useState({});
  const [sectionVisibility, setSectionVisibility] = useState({});
  const [scrollTarget, setScrollTarget] = useState(null);
  const [activeMetric, setActiveMetric] = useState(null);

  const rawRole = localStorage.getItem('role') || '';
  const role = rawRole.replace('ROLE_', '');
  const username = localStorage.getItem('username') || '';
  const navigate = useNavigate();

  const isAdmin = role === 'ADMIN' || role === 'SECONDARY_ADMIN';
  const isRecruiter = role === 'RECRUITER';

  const recruiterOptions = useMemo(() => {
    if (!isAdmin) return [];
    const map = new Map();
    reports.forEach((report) => {
      map.set(report.recruiterId, {
        id: report.recruiterId,
        username: report.recruiterUsername,
        email: report.recruiterEmail,
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.username || '').localeCompare(b.username || '', undefined, { sensitivity: 'base' })
    );
  }, [reports, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setSelectedRecruiterId('self');
    }
  }, [isAdmin]);

  useEffect(() => {
    const shouldAwaitDates =
      range === 'custom' && (!customStart || !customEnd);

    if (shouldAwaitDates) {
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      try {
        setLoading(true);
        setError('');

        const params = {};
        if (range === 'custom') {
          if (customStart) params.startDate = customStart;
          if (customEnd) params.endDate = customEnd;
        } else {
          params.range = range;
        }

        if (isAdmin && selectedRecruiterId !== 'all') {
          params.recruiterId = selectedRecruiterId;
        }

        let data;
        if (isAdmin) {
          data = await reportAPI.getRecruiterReports(params);
        } else {
          const response = await reportAPI.getMyReport(params);
          data = response ? [response] : [];
        }

        setReports(Array.isArray(data) ? data : []);
        setExpanded({});
      } catch (err) {
        setError(err.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [range, customStart, customEnd, selectedRecruiterId, isAdmin]);

  useEffect(() => {
    if (isAdmin && recruiterOptions.length > 0) {
      const availableIds = recruiterOptions.map((opt) => String(opt.id));
      if (selectedRecruiterId !== 'all' && !availableIds.includes(String(selectedRecruiterId))) {
        setSelectedRecruiterId('all');
      }
    }
  }, [recruiterOptions, selectedRecruiterId, isAdmin]);

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleMetricClick = (recruiterKey, section) => {
    setExpanded((prev) => {
      const isAlreadyExpanded = prev[recruiterKey];
      const nextState = {
        ...prev,
        [recruiterKey]: section === 'toggle'
          ? !prev[recruiterKey]
          : true,
      };

      setSectionVisibility((prevVisibility) => ({
        ...prevVisibility,
        [recruiterKey]: section === 'toggle' ? 'all' : section,
      }));

      if (section !== 'toggle') {
        if (!isAlreadyExpanded) {
          setScrollTarget({ key: recruiterKey, section });
        }
        setActiveMetric({ key: recruiterKey, section });
      }

      return nextState;
    });
  };

  const parseLocalDate = (value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(value);
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = parseLocalDate(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString();
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const date = parseLocalDate(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  const rangeLabel = (report) => {
    if (!report) return '';
    if (report.startDate === report.endDate) {
      return formatDate(report.startDate);
    }
    return `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`;
  };

  const renderEmptyState = (message) => (
    <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
        <i className="fas fa-clipboard-list text-indigo-500"></i>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );

  const renderTable = (columns, rows, keyPrefix) => (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={`${keyPrefix}-col-${col.key}`}
                className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rows.map((row, idx) => (
            <tr
              key={`${keyPrefix}-row-${idx}`}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                if (keyPrefix.includes('candidates') && row.id) {
                  navigate(`/candidates/${row.id}`);
                } else if (keyPrefix.includes('applications') && row.id) {
                  navigate(`/applications/${row.id}`);
                } else if (keyPrefix.includes('interviews') && row.id) {
                  navigate(`/interviews?highlight=${row.id}`);
                }
              }}
            >
              {columns.map((col) => (
                <td key={`${keyPrefix}-cell-${col.key}-${idx}`} className="px-4 py-2 text-sm text-gray-700">
                  {col.render ? col.render(row) : row[col.key] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const rangeButtons = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const pendingCustomDates = range === 'custom' && (!customStart || !customEnd);

  useEffect(() => {
    if (!scrollTarget) return;
    const elementId = `${scrollTarget.key}-${scrollTarget.section}`;
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setScrollTarget(null);
  }, [scrollTarget]);

  useEffect(() => {
    if (!activeMetric) return;
    const timeout = setTimeout(() => setActiveMetric(null), 2000);
    return () => clearTimeout(timeout);
  }, [activeMetric]);

  return (
    <div className="flex min-h-screen bg-gray-50 mt-16">
      <Navbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recruitment Reports</h1>
            <p className="text-sm text-gray-600">
              {isAdmin
                ? 'Review recruiter performance across candidates, applications, and interviews.'
                : 'Track your candidate submissions, applications, and interviews.'}
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-sm font-medium text-gray-600">Signed in as</span>
            <span className="text-sm font-semibold text-indigo-600">{username || 'User'}</span>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
              {role || 'N/A'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-2">
            {rangeButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setRange(btn.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  range === btn.value
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {range === 'custom' && (
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Recruiter</label>
              <select
                value={selectedRecruiterId}
                onChange={(e) => setSelectedRecruiterId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Recruiters</option>
                {recruiterOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.username} {option.email ? `(${option.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          </div>
        )}

        {pendingCustomDates && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-sm">
              <i className="fas fa-info-circle"></i>
              <span>Select both start and end dates to generate a custom range report.</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="animate-spin h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
              <p className="text-sm text-gray-600">Loading reports...</p>
            </div>
          </div>
        ) : reports.length === 0 ? (
          renderEmptyState(
            isAdmin
              ? 'No recruiter activity found for the selected range.'
              : 'No activity recorded for the selected range.'
          )
        ) : (
          <div className="space-y-5">
            {reports.map((report) => {
              const recruiterKey = report.recruiterId ?? report.recruiterUsername;
              const isExpanded = expanded[recruiterKey];

              const metrics = [
                {
                  label: 'New Candidates',
                  value: report.candidateCount,
                  icon: 'fa-user-plus',
                  color: 'bg-blue-100 text-blue-700',
                  section: 'candidates',
                },
                {
                  label: 'Applications',
                  value: report.applicationCount,
                  icon: 'fa-file-signature',
                  color: 'bg-purple-100 text-purple-700',
                  section: 'applications',
                },
                {
                  label: 'Interviews',
                  value: report.interviewCount,
                  icon: 'fa-calendar-check',
                  color: 'bg-green-100 text-green-700',
                  section: 'interviews',
                },
              ];

              return (
                <div key={recruiterKey} className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-gray-900">{report.recruiterUsername || 'Recruiter'}</h2>
                        {report.recruiterEmail && (
                          <span className="text-sm text-gray-500">{report.recruiterEmail}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Reporting window: {rangeLabel(report)}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                      {metrics.map((metric) => {
                        const isActive =
                          activeMetric &&
                          activeMetric.key === recruiterKey &&
                          activeMetric.section === metric.section;
                        return (
                          <button
                            key={`${recruiterKey}-${metric.label}`}
                            type="button"
                            onClick={() => handleMetricClick(recruiterKey, metric.section)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-left ${
                              isActive
                                ? 'bg-white ring-2 ring-indigo-400'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <span className={`h-9 w-9 rounded-full flex items-center justify-center ${metric.color}`}>
                              <i className={`fas ${metric.icon}`}></i>
                            </span>
                            <div>
                              <p className="text-xs text-gray-500 uppercase">{metric.label}</p>
                              <p className="text-lg font-semibold text-gray-900">{metric.value}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                      <button
                      onClick={() => handleMetricClick(recruiterKey, 'toggle')}
                      className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      {isExpanded ? 'Hide details' : 'View details'}
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-xs`}></i>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="p-5 space-y-5">
                      {(() => {
                        const visibility = sectionVisibility[recruiterKey] || 'all';
                        if (visibility !== 'all' && visibility !== 'candidates') {
                          return null;
                        }
                        return (
                      <div id={`${recruiterKey}-candidates`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <i className="fas fa-user"></i>
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900">Candidates Added</h3>
                        </div>
                        {report.candidates && report.candidates.length > 0
                          ? renderTable(
                              [
                                { key: 'name', label: 'Candidate' },
                                {
                                  key: 'status',
                                  label: 'Status',
                                  render: (row) => (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                                      {row.status || 'N/A'}
                                    </span>
                                  ),
                                },
                                {
                                  key: 'createdAt',
                                  label: 'Added On',
                                  render: (row) => formatDateTime(row.createdAt),
                                },
                              ],
                              report.candidates,
                              `${recruiterKey}-candidates`
                            )
                          : renderEmptyState('No candidates were added during this period.')}
                      </div>
                        );
                      })()}

                      {(() => {
                        const visibility = sectionVisibility[recruiterKey] || 'all';
                        if (visibility !== 'all' && visibility !== 'applications') {
                          return null;
                        }
                        return (
                      <div id={`${recruiterKey}-applications`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                            <i className="fas fa-file-alt"></i>
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900">Applications Created</h3>
                        </div>
                        {report.applications && report.applications.length > 0
                          ? renderTable(
                              [
                                { key: 'candidateName', label: 'Candidate' },
                                { key: 'jobTitle', label: 'Job Title' },
                                {
                                  key: 'status',
                                  label: 'Status',
                                  render: (row) => (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                                      {row.status || 'N/A'}
                                    </span>
                                  ),
                                },
                                {
                                  key: 'appliedAt',
                                  label: 'Applied On',
                                  render: (row) => formatDateTime(row.appliedAt),
                                },
                              ],
                              report.applications,
                              `${recruiterKey}-applications`
                            )
                          : renderEmptyState('No applications were created during this period.')}
                      </div>
                        );
                      })()}

                      {(() => {
                        const visibility = sectionVisibility[recruiterKey] || 'all';
                        if (visibility !== 'all' && visibility !== 'interviews') {
                          return null;
                        }
                        return (
                      <div id={`${recruiterKey}-interviews`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <i className="fas fa-calendar-day"></i>
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900">Interviews Scheduled</h3>
                        </div>
                        {report.interviews && report.interviews.length > 0
                          ? renderTable(
                              [
                                { key: 'candidateName', label: 'Candidate' },
                                { key: 'jobTitle', label: 'Job' },
                                {
                                  key: 'interviewDate',
                                  label: 'Interview Date',
                                  render: (row) => formatDate(row.interviewDate),
                                },
                                {
                                  key: 'interviewTime',
                                  label: 'Time',
                                  render: (row) =>
                                    row.interviewTime ? row.interviewTime : '—',
                                },
                                {
                                  key: 'scheduledOn',
                                  label: 'Scheduled On',
                                  render: (row) => formatDateTime(row.scheduledOn),
                                },
                              ],
                              report.interviews,
                              `${recruiterKey}-interviews`
                            )
                          : renderEmptyState('No interviews were scheduled during this period.')}
                      </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;

