import { useEffect, useState } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import SubmissionReviewModal from '../../components/admin/SubmissionReviewModal';
import { fetchAllSubmissions, reviewSubmission } from '../../api/submissions';

/* const REVIEW_STATUS_CLASS = {
  Pending:  'status-badge-Submitted',
  Approved: 'status-badge-Approved',
  Rejected: 'status-badge-Rejected',
};  */// comment this later

const STATUS_BADGE = {
  Pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  Approved : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', 
  Rejected : 'bg-rose-500/10 text-rose-500 border-rose-500/30',
};

const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  // comment this line later
  const [reviewTarget, setReviewTarget] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const loadSubmissions = async () => {
    try {
      const { data } = await fetchAllSubmissions();
      setSubmissions(data);
      if(data.length > 0 && !selectedSubmission)
      {
        setSelectedSubmission(data[0]);
      }
    } catch {
      alert('Failed to load submissions');
    }
  };

  // eslint-disable-next-line
  useEffect(() => { loadSubmissions(); }, []);

  const handleReview = async (status) => {
    if(!selectedSubmission) return;

    try{
      await reviewSubmission(selectedSubmission._id, status);
      // updating local state smoothly
      setSelectedSubmission((prev) => ({...prev, reviewStatus: status}));
      loadSubmissions();
    }catch(err)
    {
      alert(err.response?.data?.message || 'Review action failed..!');
    }
  }

  const pending  = submissions.filter((s) => s.reviewStatus === 'Pending').length;
  const approved = submissions.filter((s) => s.reviewStatus === 'Approved').length;
  const rejected = submissions.filter((s) => s.reviewStatus === 'Rejected').length;

  const currentTask = selectedSubmission?.taskId || {};
  const currentTalent = selectedSubmission?.talentId || {};

  /* const thCls = 'text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.7px] text-text-faint border-b border-border whitespace-nowrap';
  const tdCls = 'px-5 py-4 border-b border-border align-middle'; */

  console.log(Sidebar, SubmissionReviewModal);

  return (
    <div className="flex min-h-screen bg-bg-dark font-sans text-text-primary">
      <Sidebar />

      <main className="ml-60 flex-1 px-10 py-9 flex flex-col h-screen overflow-hidden">

        {/* Header */}
        <div className="mb-6 shirnk-0">
          <h1 className="text-[26px] font-bold tracking-tight text-text-primary">Submissions</h1>
          <p className="mt-1 text-sm text-text-muted">Review talent submissions and approve or reject them.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
          {[
            { label: 'Total',    value: submissions.length, color: 'text-text-primary' },
            { label: 'Pending',  value: pending,            color: 'text-info'         },
            { label: 'Approved', value: approved,           color: 'text-success'      },
            { label: 'Rejected', value: rejected,           color: 'text-danger'       },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-bg-card border border-border rounded-xl px-5 py-3 flex flex-col gap-1 hover:border-border-light transition-colors">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-[0.6px]">{label}</span>
              <span className={`text-[24px] font-bold tracking-tight ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* -------- SPLIT-PANE CONTAINER ----------- */}
        {submissions.length === 0 ? (
          <div className="bg-bg-card border border-border">
            No submission yet - talents will submit here.
          </div>
        ) : (
          <div className="flex flex-1 gap-5 overflow-hidden pb-4">
            {/* -------------- LEFT PANE: Cards List */}
            <div className="w-1/3 flex flex-col gap-3  overflow-y-auto pr-1">
              {submissions.map((sub) => {
                const isSelected = selectedSubmission?._id === sub._id;
                const talent = sub.talentId || {};
                const task = sub.taskId || {};

                return (
                  <div key={sub._id}
                  onClick={()=> setSelectedSubmission(sub)} className={`p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
                    isSelected 
                    ? 'bg-bg-card border-primary/60 shadow-[0_4px_20px_rgba(0, 0, 0, 0.4)]'
                    : 'bg-bg-card/50 border-border hover:bg-bg-card/80 hover:border-border-light'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shirnk-0">
                        {talent.name?.[0] ?? '?'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-text-primary">
                          {task.title || 'Untitled Task'}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {talent.name || 'Unknown Talent'}
                        </p>
                      </div>

                      {/* status dot */}
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        sub.reviewStatus === 'Approved'
                        ? 'bg-emerald-500'
                        : sub.reviewStatus === 'Rejected'
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                      }`}
                      title={sub.reviewStatus || 'Pending'}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ----------- RIGHT PANE --------------- */}
            <div className="flex-1 bg-bg-card border border-border rounded-xl p-6 flex flex-col justify-between overflow-y-auto backdrop-blur-md">
              {selectedSubmission ? (
                <div className="flex flex-col gap-5">
                  {/* Task Header */}
                  <div className="flex justify-between items-start border-b border-border pb-4">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-faint">
                        Selected Submission
                      </span>
                      <h2 className="text-lg font-bold text-text-primary mt-1">{currentTask.title || '-'}</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[selectedSubmission.reviewStatus] || STATUS_BADGE.Pending}`}>
                      {selectedSubmission.reviewStatus || 'Pending'}
                    </span>
                  </div>

                  {/* Talent Details */}
                  <div className="flex items-center gap-3 bg-bg-surface p-3.5 rounded-lg border border-border">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {currentTalent.name?.[0] ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{currentTalent.name || 'Unknown Talent'}</p>
                      <p className="text-xs text-text-faint">{currentTalent.email || '-'}</p>
                    </div>
                  </div>

                  {/* Submission Notes */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-faint mb-2">
                      Notes
                    </p>
                    <div className="text-sm leading-relaxed bg-bg-surface rounded-lg p-4 border border-border text-text-muted">
                      {selectedSubmission.notes || (
                        <span className="italic text-text-faint">No notes provided.</span>
                      )}
                    </div>
                  </div>

                  {/* Attachment */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-faint mb-2">
                      Submitted File
                    </p>
                    {selectedSubmission.fileUrl ? (
                      <a
                      href={selectedSubmission.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4 hover:text-secondary transition-colors">
                        <span>Open File Link</span>
                      </a>
                    ) : (
                      <p className="text-sm text-text-faint italic">No File Attached.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-text-faint">
                  Select a submission from the left pane to view details
                </div>
              )}

              {/* Action Buttons */}
              {selectedSubmission && (
                <div className="flex gap-3 pt-4 border-t border-border mt-6">
                  {selectedSubmission.reviewStatus === 'Approved' ? (
                    <button disabled
                    className="w-full py-2.5 bg-success/20 text-success border border-scucess/30 rounded-lg text-sm font-semibold cursor-not-allowed opacity-80 flex items-center justify-center gap-1.5">
                      Approved
                    </button>
                  ) : selectedSubmission.reviewStatus === 'Rejected' ? (
                    <button disabled className="w-full py-2.5 bg-danger/20 text-danger border border-danger/30 rounded-lg text-sm font-semibold cursor-not-allowed opacity-80 flex items-center justify-center gap-1.5">
                      Rejected
                    </button>
                  ): (
                      <>
                        <button onClick={() => handleReview('Rejected')}
                          className='flex-1 py-2.5 bg-danger/10 text-danger border border-danger/30 rounded-lg text-sm font-semibold  hover:bg-danger/20 transition-all'>
                          Reject
                        </button>
                        <button onClick={() => handleReview('Approved')}
                          className="flex-1 py-2.5 bg-success/10 text-success border border-success/30 rounded-lg text-sm font-semibold hover:bg-success/20 transition-all">
                          Approve
                        </button>
                      </>
                    )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {reviewTarget && (
        <SubmissionReviewModal
          submission={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onReviewed={() => { setReviewTarget(null); loadSubmissions(); }}
        />
      )}
    </div>
  );
};

export default SubmissionsPage;
