import { useEffect, useState } from 'react';

export default function AdminPanel() {
  const [pendingArticles, setPendingArticles] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    setPendingArticles([
      { id: '1', title: 'Pending Article 1', author: 'Writer 1', status: 'pending' },
      { id: '2', title: 'Pending Article 2', author: 'Writer 2', status: 'pending' },
    ]);

    setReports([
      { id: '1', reason: 'Inappropriate content', createdAt: '2026-06-26', status: 'open' },
      { id: '2', reason: 'Misinformation', createdAt: '2026-06-25', status: 'open' },
    ]);
  }, []);

  const handleApprove = (id: string) => {
    console.log('Approving article:', id);
  };

  const handleReject = (id: string) => {
    console.log('Rejecting article:', id);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-12">Admin Panel</h1>

        {/* Pending Articles */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Pending Approval</h2>
          <div className="space-y-4">
            {pendingArticles.map((article: any) => (
              <div key={article.id} className="border border-gray-800 rounded-lg p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{article.title}</h3>
                  <p className="text-gray-400">by {article.author}</p>
                </div>
                <div className="space-x-4">
                  <button
                    onClick={() => handleApprove(article.id)}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(article.id)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reports */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Reports</h2>
          <div className="space-y-4">
            {reports.map((report: any) => (
              <div key={report.id} className="border border-gray-800 rounded-lg p-6">
                <p className="font-bold">{report.reason}</p>
                <p className="text-gray-400 text-sm">Reported on {report.createdAt}</p>
                <button className="mt-4 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded">
                  Review
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
